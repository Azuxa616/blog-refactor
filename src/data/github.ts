// 静态 GitHub 数据
// TODO: 后续优化为从 GitHub API 动态获取
// 添加中文注释

export const githubData = {
  user: {
    avatar_url: "https://avatars.githubusercontent.com/u/example?v=4",
    name: "Azuxa",
    login: "azuxa",
    bio: "Full-stack developer passionate about building great things",
    followers: 42,
    following: 18,
    public_repos: 12
  },
  repos: [
    {
      id: 1,
      name: "blog-refactor",
      description: "Astro blog refactor project with Alpine.js",
      html_url: "https://github.com/azuxa/blog-refactor",
      updated_at: "2024-01-15T10:30:00Z",
      language: "TypeScript",
      license: { name: "MIT", spdx_id: "MIT" },
      stargazers_count: 5
    },
    {
      id: 2,
      name: "awesome-project",
      description: "An awesome project for learning",
      html_url: "https://github.com/azuxa/awesome-project",
      updated_at: "2024-01-10T08:45:00Z",
      language: "JavaScript",
      license: { name: "Apache-2.0", spdx_id: "Apache-2.0" },
      stargazers_count: 12
    }
  ],
  skills: {
    learned: [
      { name: "TypeScript", proficiency: 85, imgUrl: "/imgs/logo-ts.webp", docUrl: "https://www.typescriptlang.org/" },
      { name: "React", proficiency: 75, imgUrl: "/imgs/logo-react.webp", docUrl: "https://zh-hans.react.dev/" },
      { name: "Vue", proficiency: 65, imgUrl: "/imgs/logo-vue.webp", docUrl: "https://vuejs.org/" },
      { name: "Ant Design", proficiency: 50, imgUrl: "/imgs/logo-antd.webp", docUrl: "https://ant.design/index-cn" },
    ],
    practicing: [
      { name: "Next.js", proficiency: 60, imgUrl: "/imgs/logo-nextjs.webp", docUrl: "https://nextjs.org/" },
      { name: "Tailwind CSS", proficiency: 60, imgUrl: "/imgs/logo-tailwindcss.webp", docUrl: "https://tailwindcss.com/" },
      { name: "Node.js", proficiency: 70, imgUrl: "/imgs/logo-nodejs.webp", docUrl: "https://nodejs.org/" },
      { name: "FastApi", proficiency: 50, imgUrl: "/imgs/logo-fastapi.webp", docUrl: "https://fastapi.tiangolo.com/" }
    ]
  }
}
