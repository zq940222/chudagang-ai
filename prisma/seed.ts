import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const skillTags = [
  { name: "python", category: "Language", localeZh: "Python", localeEn: "Python" },
  { name: "typescript", category: "Language", localeZh: "TypeScript", localeEn: "TypeScript" },
  { name: "react", category: "Frontend", localeZh: "React", localeEn: "React" },
  { name: "nextjs", category: "Framework", localeZh: "Next.js", localeEn: "Next.js" },
  { name: "langchain", category: "AI", localeZh: "LangChain", localeEn: "LangChain" },
  { name: "openai-api", category: "AI", localeZh: "OpenAI API", localeEn: "OpenAI API" },
  { name: "claude-api", category: "AI", localeZh: "Claude API", localeEn: "Claude API" },
  { name: "rag", category: "AI", localeZh: "RAG 检索增强生成", localeEn: "RAG" },
  { name: "vector-db", category: "AI", localeZh: "向量数据库", localeEn: "Vector Database" },
  { name: "fine-tuning", category: "AI", localeZh: "模型微调", localeEn: "Fine-Tuning" },
  { name: "computer-vision", category: "AI", localeZh: "计算机视觉", localeEn: "Computer Vision" },
  { name: "nlp", category: "AI", localeZh: "自然语言处理", localeEn: "NLP" },
  { name: "mlops", category: "DevOps", localeZh: "MLOps", localeEn: "MLOps" },
  { name: "aws", category: "Cloud", localeZh: "AWS", localeEn: "AWS" },
  { name: "docker", category: "DevOps", localeZh: "Docker", localeEn: "Docker" },
  { name: "postgresql", category: "Database", localeZh: "PostgreSQL", localeEn: "PostgreSQL" },
  { name: "redis", category: "Database", localeZh: "Redis", localeEn: "Redis" },
  { name: "graphql", category: "API", localeZh: "GraphQL", localeEn: "GraphQL" },
  { name: "rust", category: "Language", localeZh: "Rust", localeEn: "Rust" },
  { name: "go", category: "Language", localeZh: "Go", localeEn: "Go" },
];

async function main() {
  console.log("Seeding skill tags...");
  for (const tag of skillTags) {
    await prisma.skillTag.upsert({
      where: { name: tag.name },
      update: tag,
      create: tag,
    });
  }
  console.log(`Seeded ${skillTags.length} skill tags.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
