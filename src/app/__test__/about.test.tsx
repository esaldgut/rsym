import React from "react";
import {render, screen} from "@testing-library/react"
import AboutPage from "../(general)/about/page";

describe("AboutPage", () => {
  it("1- Renderiza correctamente el texto principal", () => {
    render(<AboutPage />);
    const textElement = screen.getByText(/YAAN About page/i);
    expect(textElement).toBeTruthy();
  });

  it("2- Contiene la clase de estilo correcta", () => {
    render(<AboutPage />);
    const textElement = screen.getByText(/YAAN About page/i);
    expect(textElement).toHaveClass("text-7xl");
  });

  it("3- El componente se renderiza sin errores", () => {
    const { container } = render(<AboutPage />);
    expect(container).toBeDefined();
    expect(container.firstChild).not.toBeNull();
  });
});
