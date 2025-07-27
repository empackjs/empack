import { execSync } from "child_process";

execSync("vitepress build docs", { stdio: "inherit" });
execSync(
  'cd docs/.vitepress/dist && git init && git add . && git commit -m "deploy docs"',
);
execSync(
  "cd docs/.vitepress/dist && git push -f git@github.com:empackjs/empack.git main:github-pages",
);
