import { AppShell as Shell } from "@mantine/core";
import Navbar from "./Navbar";



export default function AppShell() {
    return (
    <Shell navbar={{ width: 256, breakpoint: 0 }}>
        <Shell.Navbar p="md" >
            <Navbar/>
        </Shell.Navbar>
        <Shell.Main>
            Content
        </Shell.Main>
    </Shell> )
}