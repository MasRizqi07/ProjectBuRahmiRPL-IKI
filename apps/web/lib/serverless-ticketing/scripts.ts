export const JOIN_QUEUE_SCRIPT = `
local score = redis.call('ZSCORE', KEYS[1], ARGV[1])
local created = 0
if not score then
  score = redis.call('INCR', KEYS[3])
  redis.call('ZADD', KEYS[1], score, ARGV[1])
  redis.call('HSET', KEYS[2], ARGV[1], 'WAITING')
  created = 1
end
local rank = redis.call('ZRANK', KEYS[1], ARGV[1])
local state = redis.call('HGET', KEYS[2], ARGV[1]) or 'WAITING'
return {created, rank, state}
`

export const RELEASE_INITIALIZATION_LOCK_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`

export const QUEUE_STATUS_SCRIPT = `
local now = tonumber(ARGV[2])
local sweepLimit = tonumber(ARGV[5])
local released = tonumber(redis.call('GET', KEYS[3]) or '0')

local expiredAdmissions = redis.call('ZRANGEBYSCORE', KEYS[5], '-inf', now, 'LIMIT', 0, sweepLimit)
for _, expiredUserId in ipairs(expiredAdmissions) do
  local markerKey = ARGV[6] .. expiredUserId
  local currentState = redis.call('HGET', KEYS[2], expiredUserId)
  if currentState == 'ADMITTED' and not redis.call('GET', markerKey) then
    redis.call('HSET', KEYS[2], expiredUserId, 'EXPIRED')
    released = released + 1
  end
  redis.call('ZREM', KEYS[5], expiredUserId)
end

local expiredHolds = redis.call('ZRANGEBYSCORE', KEYS[6], '-inf', now, 'LIMIT', 0, sweepLimit)
for _, expiredUserId in ipairs(expiredHolds) do
  local holdKey = ARGV[7] .. expiredUserId
  local payload = redis.call('GET', holdKey)
  if payload then
    local hold = cjson.decode(payload)
    if tonumber(hold.expiresAtEpochMs) <= now then
      redis.call('INCRBY', KEYS[4], tonumber(hold.quantity))
      redis.call('INCRBY', ARGV[8] .. hold.tierId, tonumber(hold.quantity))
      redis.call('DEL', holdKey)
      redis.call('HSET', KEYS[2], expiredUserId, 'EXPIRED')
      redis.call('ZADD', KEYS[7], now, hold.orderId)
      released = released + 1
    end
  end
  redis.call('ZREM', KEYS[6], expiredUserId)
end
redis.call('SET', KEYS[3], released)

local rank = redis.call('ZRANK', KEYS[1], ARGV[1])
if not rank then return {'NOT_JOINED', -1, released} end
local state = redis.call('HGET', KEYS[2], ARGV[1]) or 'WAITING'
if state ~= 'WAITING' and state ~= 'ADMITTED' then
  return {state, rank, released}
end

if state == 'ADMITTED' then
  if redis.call('GET', KEYS[8]) then return {'ADMITTED', rank, released} end
  redis.call('HSET', KEYS[2], ARGV[1], 'EXPIRED')
  redis.call('ZREM', KEYS[5], ARGV[1])
  released = released + 1
  redis.call('SET', KEYS[3], released)
  return {'EXPIRED', rank, released}
end

local capacity = tonumber(ARGV[3])
if rank < released + capacity then
  local expiresAt = now + tonumber(ARGV[4])
  redis.call('SET', KEYS[8], ARGV[1], 'PX', tonumber(ARGV[4]), 'NX')
  redis.call('HSET', KEYS[2], ARGV[1], 'ADMITTED')
  redis.call('ZADD', KEYS[5], expiresAt, ARGV[1])
  return {'ADMITTED', rank, released}
end
return {'WAITING', rank, released}
`

export const RESERVE_SCRIPT = `
local existing = redis.call('GET', KEYS[6])
if existing then
  local record = cjson.decode(existing)
  if record.hash ~= ARGV[5] then return {'IDEMPOTENCY_CONFLICT', existing} end
  return {'IDEMPOTENT', record.response}
end

local admittedOwner = redis.call('GET', KEYS[4])
local state = redis.call('HGET', KEYS[5], ARGV[1])
if admittedOwner ~= ARGV[1] or state ~= 'ADMITTED' then return {'NOT_ADMITTED', ''} end
if redis.call('EXISTS', KEYS[3]) == 1 then return {'ACTIVE_HOLD_EXISTS', ''} end

local available = tonumber(redis.call('GET', KEYS[1]) or '0')
local tierAvailable = tonumber(redis.call('GET', KEYS[2]) or '0')
local quantity = tonumber(ARGV[2])
if available < quantity or tierAvailable < quantity then
  local remaining = math.min(available, tierAvailable)
  local response = cjson.encode({status = 'SOLD_OUT', remaining = remaining})
  redis.call('SET', KEYS[6], cjson.encode({hash = ARGV[5], response = response}), 'EX', tonumber(ARGV[7]))
  return {'SOLD_OUT', response}
end

redis.call('DECRBY', KEYS[1], quantity)
redis.call('DECRBY', KEYS[2], quantity)
redis.call('SET', KEYS[3], ARGV[4])
redis.call('ZADD', KEYS[7], tonumber(ARGV[3]), ARGV[1])
redis.call('DEL', KEYS[4])
redis.call('HSET', KEYS[5], ARGV[1], 'HOLD_CREATED')
local created = cjson.decode(ARGV[6])
created.remaining = tierAvailable - quantity
local createdResponse = cjson.encode(created)
redis.call('SET', KEYS[6], cjson.encode({hash = ARGV[5], response = createdResponse}), 'EX', tonumber(ARGV[7]))
return {'CREATED', createdResponse}
`

export const FINALIZE_HOLD_SCRIPT = `
local payload = redis.call('GET', KEYS[1])
if not payload then
  local state = redis.call('HGET', KEYS[4], ARGV[1]) or 'MISSING'
  return {0, state}
end
local hold = cjson.decode(payload)
if hold.orderId ~= ARGV[3] then return {-1, 'ORDER_MISMATCH'} end

if ARGV[2] == 'SUCCESS' then
  redis.call('HSET', KEYS[4], ARGV[1], 'COMPLETED')
else
  redis.call('INCRBY', KEYS[2], tonumber(hold.quantity))
  redis.call('INCRBY', KEYS[6], tonumber(hold.quantity))
  redis.call('HSET', KEYS[4], ARGV[1], 'RELEASED')
end
redis.call('DEL', KEYS[1])
redis.call('ZREM', KEYS[5], ARGV[1])
redis.call('INCR', KEYS[3])
return {1, ARGV[2]}
`

export const SWEEP_EVENT_SCRIPT = `
local now = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local released = tonumber(redis.call('GET', KEYS[2]) or '0')
local expiredAdmissionCount = 0
local expiredHoldCount = 0

local admissions = redis.call('ZRANGEBYSCORE', KEYS[3], '-inf', now, 'LIMIT', 0, limit)
for _, userId in ipairs(admissions) do
  local markerKey = ARGV[3] .. userId
  if redis.call('HGET', KEYS[1], userId) == 'ADMITTED' and not redis.call('GET', markerKey) then
    redis.call('HSET', KEYS[1], userId, 'EXPIRED')
    released = released + 1
    expiredAdmissionCount = expiredAdmissionCount + 1
  end
  redis.call('ZREM', KEYS[3], userId)
end

local holds = redis.call('ZRANGEBYSCORE', KEYS[4], '-inf', now, 'LIMIT', 0, limit)
for _, userId in ipairs(holds) do
  local holdKey = ARGV[4] .. userId
  local payload = redis.call('GET', holdKey)
  if payload then
    local hold = cjson.decode(payload)
    if tonumber(hold.expiresAtEpochMs) <= now then
      redis.call('INCRBY', KEYS[5], tonumber(hold.quantity))
      redis.call('INCRBY', ARGV[5] .. hold.tierId, tonumber(hold.quantity))
      redis.call('DEL', holdKey)
      redis.call('HSET', KEYS[1], userId, 'EXPIRED')
      redis.call('ZADD', KEYS[6], now, hold.orderId)
      released = released + 1
      expiredHoldCount = expiredHoldCount + 1
    end
  end
  redis.call('ZREM', KEYS[4], userId)
end
redis.call('SET', KEYS[2], released)
return {expiredAdmissionCount, expiredHoldCount, released}
`
