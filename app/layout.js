import "./globals.css";

export const metadata = {
  title: "Stock.io",
  description: "AI Powered Stock Intelligence Platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", backgroundColor: "#0f172a", color: "white", zoom: "1.25" }}>
        {children}
      </body>
    </html>
  );
}
