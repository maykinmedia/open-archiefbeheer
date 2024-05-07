import React from "react";

import "./App.css";

export type AppProps = React.ComponentProps<"div">;

function App({ children }: AppProps) {
  return <div className="App">{children}</div>;
}

export default App;
