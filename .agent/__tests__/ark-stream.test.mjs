import assert from "node:assert/strict";
import test from "node:test";
import { readArkStream } from "../ark-stream.mjs";

function sseResponse(chunks) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "content-type": "text/event-stream" },
  });
}

test("assembles streamed SSE content across chunk boundaries", async () => {
  const deltas = [];
  const content = await readArkStream(
    sseResponse([
      'data: {"choices":[{"delta":{"content":"Hel"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":"lo"}}]}\n\n',
      "data: [DONE]\n\n",
    ]),
    (chunk) => deltas.push(chunk),
  );

  assert.equal(content, "Hello");
  assert.deepEqual(deltas, ["Hel", "lo"]);
});

test("handles a JSON data line split across network chunks", async () => {
  const content = await readArkStream(
    sseResponse([
      'data: {"choices":[{"delta":{"content":"A',
      'B"}}]}\n\n',
      "data: [DONE]\n\n",
    ]),
  );

  assert.equal(content, "AB");
});

test("supports non-streaming JSON fallback responses", async () => {
  const response = new Response(
    JSON.stringify({
      choices: [{ message: { content: "fallback" } }],
    }),
    { headers: { "content-type": "application/json" } },
  );

  assert.equal(await readArkStream(response), "fallback");
});

test("surfaces stream error payloads", async () => {
  await assert.rejects(
    readArkStream(
      sseResponse(['data: {"error":{"message":"upstream reset"}}\n\n']),
    ),
    /upstream reset/,
  );
});
