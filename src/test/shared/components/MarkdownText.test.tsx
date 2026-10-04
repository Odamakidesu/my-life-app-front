import React from "react";
import { render, screen } from "@testing-library/react";
import MarkdownText from "shared/components/MarkdownText";

describe("MarkdownText", () => {
  test("Markdown の記法を整形し、改行はそのまま改行にする", () => {
    const { container } = render(<MarkdownText text={"**太字**\n- 項目1\n- 項目2\n\n1行目\n2行目"} />);

    expect(screen.getByText("太字").tagName).toBe("STRONG");
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(container.querySelectorAll("br").length).toBeGreaterThan(0);
  });

  test("HTML は解釈せず、スクリプトを埋め込めない", () => {
    const { container } = render(<MarkdownText text={'<img src=x onerror="alert(1)"><script>alert(1)</script>'} />);

    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector("script")).toBeNull();
  });

  test("リンクは新しいタブで開き、javascript: の URL は無効にする", () => {
    render(<MarkdownText text={"[外部](https://example.com) [危険](javascript:alert(1))"} />);

    const external = screen.getByRole("link", { name: "外部" });
    expect(external).toHaveAttribute("target", "_blank");
    expect(external).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("危険").closest("a")?.getAttribute("href") ?? "").not.toContain("javascript");
  });
});
