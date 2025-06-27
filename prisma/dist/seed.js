"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require('bcryptjs');
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        // Create roles
        const adminRole = yield prisma.roles.upsert({
            where: { name: 'admin' },
            update: {},
            create: {
                name: 'admin',
                description: 'Administrator',
                permissions: [],
            },
        });
        const salesRepRole = yield prisma.roles.upsert({
            where: { name: 'sales_rep' },
            update: {},
            create: {
                name: 'sales_rep',
                description: 'Sales Representative',
                permissions: [],
            },
        });
        // Create admin user
        const adminEmail = 'admin@example.com';
        const adminPassword = 'admin123'; // Change after first login!
        const hashedPassword = yield bcrypt.hash(adminPassword, 10);
        const adminUser = yield prisma.users.upsert({
            where: { email: adminEmail },
            update: {},
            create: {
                name: 'Admin User',
                email: adminEmail,
                password: hashedPassword,
            },
        });
        // Assign admin role
        yield prisma.user_roles.upsert({
            where: {
                user_id_role_id: {
                    user_id: adminUser.id,
                    role_id: adminRole.id,
                },
            },
            update: {},
            create: {
                user_id: adminUser.id,
                role_id: adminRole.id,
            },
        });
        console.log('Seed complete!');
        console.log('Admin credentials:');
        console.log(`  Email:    ${adminEmail}`);
        console.log(`  Password: ${adminPassword}`);
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
