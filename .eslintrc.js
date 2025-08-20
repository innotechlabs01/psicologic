import { defineConfig } from "eslint/config";
import html from "@html-eslint/eslint-plugin";

export default defineConfig([
    // lint html files
    {
        files: ["**/*.html"],
        plugins: {
            html,
        },
        language: "html/html",
        languageOptions: {
            // This tells the parser to treat {{ ... }} as template syntax,
            // so it won’t try to parse contents inside as regular HTML
            templateEngineSyntax: {
                "{{": "}}",
            },
        },
        rules: {
            "html/require-img-alt": "error"
        }
    }
]);