# 🧠 CitiVoice System (Backend) | [CitiVoice Swagger](https://citi-voice.onrender.com/api/swagger#/)

In many regions, complaints and feedback regarding public services are handled through fragmented, informal, or outdated channels, often resulting in delayed responses, lack of accountability, and low citizen satisfaction.

The **CitizVoice System** aims to address this gap by providing a centralized, digital platform where citizens can easily submit complaints or feedback and track their resolution. Government institutions can efficiently receive, categorize, and respond to submissions via a simple, streamlined interface.

## Tech Stack Used

 Backend     | Database            | Authentication | Other Tools                          |
-------------|---------------------|----------------|---------------------------------------|
 **NestJS**  | PostgreSQL + Prisma | JWT            | NodeMailer, Multer

## Getting Started

### 1. Clone the Repository

```bash
git clone git@github.com:princechrix/citi-voice.git
cd citi-voice
```

### 2. Set Up Environment Variables

```bash
DATABASE_URL=
EMAIL_USER=
EMAIL_PASS=
JWT_SECRET=
CLOUDINARY_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```


### 3. Install the dependencies & run the project

```bash
pnpm install
npx prisma generate
pnpm run start:dev
```


### 4. Deployment
It is deployed on render, here is the link to it : [CitiVoice Swagger](https://citi-voice.onrender.com/api/swagger#/)
