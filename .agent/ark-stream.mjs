function contentFromPayload(payload) {
  const choice = payload?.choices?.[0];
  const content = choice?.delta?.content ?? choice?.message?.content;
  return typeof content === "string" ? content : "";
}

function parseDataLine(line, onContent) {
  if (!line.startsWith("data:")) return false;

  const data = line.slice(5).trim();
  if (data === "") return false;
  if (data === "[DONE]") return true;

  let payload;
  try {
    payload = JSON.parse(data);
  } catch (error) {
    throw new Error(`Ark returned invalid SSE JSON: ${error.message}`);
  }

  if (payload?.error) {
    throw new Error(
      `Ark stream error: ${payload.error.message ?? JSON.stringify(payload.error)}`,
    );
  }

  const content = contentFromPayload(payload);
  if (content !== "") onContent(content);
  return false;
}

export async function readArkStream(response, onContent = () => {}) {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("text/event-stream")) {
    const text = await response.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error(
        `Ark returned an invalid response body: ${error.message}`,
      );
    }
    if (payload?.error) {
      throw new Error(
        `Ark API error: ${payload.error.message ?? JSON.stringify(payload.error)}`,
      );
    }
    return contentFromPayload(payload);
  }

  if (!response.body) {
    throw new Error("Ark stream response did not include a body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let content = "";
  let done = false;

  const consume = (line) => {
    if (done) return;
    done = parseDataLine(line, (chunk) => {
      content += chunk;
      onContent(chunk);
    });
  };

  while (!done) {
    const result = await reader.read();
    if (result.done) break;

    buffer += decoder.decode(result.value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";
    for (const line of lines) consume(line);
  }

  buffer += decoder.decode();
  if (!done && buffer !== "") consume(buffer);
  return content;
}
