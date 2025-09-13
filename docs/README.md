# YAAN Platform - Technical Documentation

## Overview
YAAN (Your Adventure Awaits Network) is a comprehensive travel platform that connects travelers with authenticated tourism providers. Built with Next.js 15, AWS Amplify Gen 2, and modern web technologies.

## 📋 Documentation Index

### 🏗️ Architecture & Systems
- [**Product Wizard System**](./PRODUCT_WIZARD_SYSTEM.md) - Complete product creation wizard
- [**Authentication System**](./AUTHENTICATION_SYSTEM.md) - AWS Cognito integration
- [**Multimedia System**](./MULTIMEDIA_SYSTEM.md) - File upload and management
- [**Location System**](./AWS_LOCATION_SYSTEM.md) - Geographic data handling
- [**Notification System**](./NOTIFICATION_SYSTEM.md) - Real-time notifications

### 🔐 Security & Performance
- [**Security Considerations**](./SECURITY.md) - Security best practices
- [**Performance Optimization**](./PERFORMANCE.md) - Performance guidelines
- [**Cookie Strategy**](./ESTRATEGIA-COOKIES-HTTP-ONLY.md) - HTTP-only cookies implementation

### 🚀 Development & Deployment
- [**Development Setup**](./DEVELOPMENT_SETUP.md) - Local development environment
- [**Deployment Guide**](./DEPLOYMENT.md) - Production deployment
- [**API Reference**](./API_REFERENCE.md) - Server Actions and Routes

### 📊 Data & Business Logic
- [**Database Schema**](./DATABASE_SCHEMA.md) - MongoDB/DynamoDB schema
- [**Business Logic**](./BUSINESS_LOGIC.md) - Core business rules
- [**GraphQL Operations**](./GRAPHQL_OPERATIONS.md) - GraphQL queries and mutations

## 🎯 Quick Start

1. **Prerequisites**: Node.js 18+, AWS CLI configured
2. **Installation**: `npm install`
3. **Development**: `npm run dev`
4. **Testing**: `npm run test`

## 🏢 Platform Features

### For Travelers
- Search and discover tourism products (circuits and packages)
- Interactive booking system
- Real-time notifications
- Social features and reviews

### For Providers
- Complete product creation wizard
- Multimedia content management
- Business analytics dashboard
- Revenue management tools

## 🛠️ Technology Stack

### Frontend
- **Next.js 15.3.4** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **AWS Amplify Gen 2** - Full-stack framework
- **AWS AppSync** - GraphQL API
- **AWS Cognito** - Authentication
- **AWS S3** - File storage
- **Server Actions** - Server-side operations

### Database
- **MongoDB** - Primary database (via AppSync)
- **AWS DynamoDB** - Caching and sessions

## 📈 Performance Metrics

- **Lighthouse Score**: 95+ (Performance, Accessibility, Best Practices, SEO)
- **Bundle Size**: < 200KB (main bundle)
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3.0s

## 🔧 Development Guidelines

### Code Standards
- ESLint + Prettier configuration
- TypeScript strict mode
- Component-driven development
- Server Actions for mutations
- Client Components only when necessary

### Git Workflow
- Feature branches from `main`
- Pull request reviews required
- Automated testing on PR
- Semantic commit messages

## 📞 Support & Contributing

For technical questions or contributions, please refer to:
- [Development Setup Guide](./DEVELOPMENT_SETUP.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Issue Templates](./.github/ISSUE_TEMPLATE/)

---

**Built with ❤️ by the YAAN Development Team**