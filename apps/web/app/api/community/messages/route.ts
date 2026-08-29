import { z } from "zod";
import { DomainError } from "@war-ticket/domain";
import {
  apiError,
  assertSameOrigin,
  parseJson,
  requireUser,
} from "@/lib/server/api";
import { database } from "@/lib/server/runtime";

const createSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine((value) => !/[<>]/.test(value), "HTML is not allowed"),
});
const querySchema = z.object({
  cursor: z.coerce.number().int().positive().optional(),
});
export async function GET(request: Request): Promise<Response> {
  try {
    const query = querySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams),
    );
    const messages =
      await database()<Array<{ id: number; body: string; created_at: Date; author: string }>>`select message.id, message.body, message.created_at, coalesce(profile.full_name, 'Member') as author from public.community_messages message left join public.profiles profile on profile.id = message.user_id where message.moderation_status = 'VISIBLE' and (${query.cursor ?? null}::bigint is null or message.id < ${query.cursor ?? null}) order by message.id desc limit 50`;
    return Response.json(
      {
        messages,
        nextCursor: messages.length === 50 ? messages.at(-1)!.id : null,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return apiError(error, request);
  }
}
export async function POST(request: Request): Promise<Response> {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = await parseJson(request, createSchema);
    const body = input.body.replace(/\s+/g, " ");
    const recent = await database()<
      Array<{ count: number }>
    >`select count(*)::integer count from public.community_messages where user_id = ${user.id} and created_at > now() - interval '1 minute'`;
    if ((recent[0]?.count ?? 0) >= 5)
      throw new DomainError("RATE_LIMITED", "Maximum five messages per minute");
    const rows =
      await database()`insert into public.community_messages (user_id, body) values (${user.id}, ${body}) returning id, body, created_at`;
    return Response.json(rows[0], { status: 201 });
  } catch (error) {
    return apiError(error, request);
  }
}
