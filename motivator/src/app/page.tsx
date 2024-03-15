import Image from "next/image";
import { Button } from "../components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-24">
      Motivator main page
      <Button>
        <Link href={"/assessor"}>Assessors</Link>
      </Button>
    </main>
  );
}
