// app/layout.js
export const metadata = {
    title: 'Meine App',
    description: 'Beschreibung hier',
  };
  
  export default function RootLayout({ children }) {
    return (
      <html lang="de">
        <body>{children}</body>
      </html>
    );
  }
  