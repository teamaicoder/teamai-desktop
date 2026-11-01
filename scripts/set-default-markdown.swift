// Makes TeamAICoder the default app for Markdown files (net.daringfireball.markdown).
// Run: swift scripts/set-default-markdown.swift   (or: make default-markdown)
// macOS may ask you to confirm the change. Install the app first.
import AppKit
import UniformTypeIdentifiers

let appURL = URL(fileURLWithPath: CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/Applications/TeamAICoder.app")
guard let markdown = UTType("net.daringfireball.markdown") else {
    FileHandle.standardError.write("This macOS doesn't know the Markdown type.\n".data(using: .utf8)!)
    exit(1)
}

NSWorkspace.shared.setDefaultApplication(at: appURL, toOpen: markdown) { error in
    if let error {
        FileHandle.standardError.write("Could not set the default Markdown app: \(error.localizedDescription)\n".data(using: .utf8)!)
        exit(1)
    }
    let current = NSWorkspace.shared.urlForApplication(toOpen: markdown)?.path ?? "none"
    print("Default app for Markdown: \(current)")
    exit(current == appURL.path ? 0 : 1)
}
RunLoop.main.run()
