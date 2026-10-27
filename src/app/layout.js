import { Geist, Geist_Mono, Noto_Nastaliq_Urdu } from "next/font/google";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Urdu / Nastaliq font — agency ke naam ke bilingual style ke liye
const nastaliq = Noto_Nastaliq_Urdu({
  variable: "--font-nastaliq",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata = {
  title: "Abu Hammas — Agency Dashboard",
  description: "Iqama expiry dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${nastaliq.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(localStorage.getItem("ah-theme")==="dark"){document.documentElement.classList.add("dark")}}catch(e){}',
          }}
        />
        {children}
      </body>
    </html>
  );
}
