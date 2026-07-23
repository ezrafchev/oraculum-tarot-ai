import OraculumApp from "../src/OraculumApp";
import { getChatGPTUser } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <OraculumApp initialUser={user} hosted />;
}
