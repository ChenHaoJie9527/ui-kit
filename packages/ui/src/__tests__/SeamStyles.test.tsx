import { renderToStaticMarkup } from "react-dom/server";
import { SeamStyles } from "../SeamStyles";

describe("SeamStyles", () => {
  it("renders the generated component styles", () => {
    const markup = renderToStaticMarkup(<SeamStyles nonce="test-nonce" />);

    expect(markup).toContain('data-seam-ui=""');
    expect(markup).toContain('nonce="test-nonce"');
    expect(markup).toContain("--uk-primary");
    expect(markup).toContain(".uk-button");
    expect(markup).toContain(".uk-dialog");
    expect(markup).toContain(".uk-toast");
  });
});
