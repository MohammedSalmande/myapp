This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

أهم الملفات التي يجب أن تعرفها
الملف
أين يستخدم؟
وظيفته
package.json
JavaScript / Next.js
يحتوي السكربتات والمكتبات
package-lock.json
npm
يثبت نسخ المكتبات بدقة
pom.xml
Maven / Spring Boot
يحتوي مكتبات Java وإعدادات البناء
application.yml
Spring Boot
إعدادات قاعدة البيانات والسيرفر
requirements.txt
Python
قائمة مكتبات Python
Dockerfile
Docker
يصف كيف تُبنى صورة التطبيق
docker-compose.yml
Docker Compose
يشغل عدة خدمات معًا مثل frontend/backend/db
.gitignore
Git
يمنع رفع ملفات غير ضرورية
أوامر أساسية للحفظ
# Java
java -version

# Maven / Spring Boot
mvn -version
mvn spring-boot:run
Spring Boot
http://localhost:8080

# Node / npm
node -v
npm -v
npm install
npm run dev
http://localhost:3000

# Python
python3 --version
pip3 --version
python3 file.py

# Docker
docker --version
docker ps
sudo docker compose up --build backend db
docker compose up --build
docker compose down

# Git
git status
git add .
git commit -m "message"
git push
جملة مختصرة مهمة
npm لإدارة مكتبات JavaScript،
Maven لإدارة مكتبات Java/Spring Boot،
pip لإدارة مكتبات Python،
Docker لتشغيل التطبيقات داخل Containers.
