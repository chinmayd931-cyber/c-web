#include <stdio.h>
#include <string.h>

int main(void) {
    float totalAmount = 0.0f;
    float totalLoss = 0.0f;
    float totalIncome = 0.0f;

    float food = 0.0f;
    float cosmetics = 0.0f;
    float travel = 0.0f;

    int choice;

    printf("========== EXPENSE TRACKER ==========\n");

    do {
        printf("\n------ MENU ------\n");
        printf("1. New Expense / Income\n");
        printf("2. Category Report\n");
        printf("3. Annual Report\n");
        printf("4. Exit\n");
        printf("Enter your choice: ");

        if (scanf("%d", &choice) != 1) {
            printf("Invalid input. Exiting.\n");
            return 1;
        }

        if (choice == 1) {
            float amount;
            int catChoice;

            printf("\nEnter amount (+ for income, - for expense): ");
            if (scanf("%f", &amount) != 1) {
                printf("Invalid amount. Returning to menu.\n");
                continue;
            }

            printf("Select Category:\n");
            printf("1. Food\n");
            printf("2. Cosmetics\n");
            printf("3. Travel\n");
            printf("Enter your choice: ");
            if (scanf("%d", &catChoice) != 1) {
                printf("Invalid category selection.\n");
                continue;
            }

            totalAmount += amount;
            if (amount > 0.0f) {
                totalIncome += amount;
            } else {
                totalLoss += -amount;
            }

            switch (catChoice) {
                case 1:
                    food += amount;
                    break;
                case 2:
                    cosmetics += amount;
                    break;
                case 3:
                    travel += amount;
                    break;
                default:
                    printf("Invalid category!\n");
                    break;
            }

            printf("\nTransaction Added Successfully!\n");
        } else if (choice == 2) {
            printf("\n------ CATEGORY REPORT ------\n");
            printf("Food: %.2f\n", food);
            printf("Cosmetics: %.2f\n", cosmetics);
            printf("Travel: %.2f\n", travel);

            float min = 0.0f;
            char catName[20] = "";

            if (food < cosmetics && food < travel) {
                min = food;
                strcpy(catName, "Food");
            } else if (cosmetics < food && cosmetics < travel) {
                min = cosmetics;
                strcpy(catName, "Cosmetics");
            } else {
                min = travel;
                strcpy(catName, "Travel");
            }

            if (min < 0.0f) {
                printf("You spent the most money on: %s (%.2f)\n", catName, min);
            } else {
                printf("No expenses recorded yet.\n");
            }
        } else if (choice == 3) {
            printf("\n------ ANNUAL REPORT ------\n");
            printf("Total Income: %.2f\n", totalIncome);
            printf("Total Loss: %.2f\n", totalLoss);
            printf("Net Total: %.2f\n", totalAmount);
        } else if (choice == 4) {
            printf("\nExiting... Thank you for using Expense Tracker!\n");
        } else {
            printf("Invalid choice! Please try again.\n");
        }

    } while (choice != 4);

    return 0;
}

