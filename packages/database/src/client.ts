import postgres from 'postgres'

export type DatabaseClient = ReturnType<typeof postgres>

export function createDatabaseClient(databaseUrl: string): DatabaseClient {
  return postgres(databaseUrl, {
    max: 20,
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
    prepare: true,
    transform: { undefined: null },
    onnotice: () => undefined,
  })
}
