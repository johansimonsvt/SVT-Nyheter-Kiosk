import React from "react";
import { createRoot } from "react-dom/client";
import { Kiosk } from "./Kiosk";

const root = createRoot(document.getElementById("root")!);
root.render(<Kiosk />);
