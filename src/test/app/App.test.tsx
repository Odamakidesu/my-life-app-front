import React from "react";
import { render, screen } from "@testing-library/react";
import App from "app/App";

test("未ログイン時はログイン画面が表示される", () => {
  render(<App />);
  expect(
    screen.getByRole("heading", { name: "ログイン" })
  ).toBeInTheDocument();
});
