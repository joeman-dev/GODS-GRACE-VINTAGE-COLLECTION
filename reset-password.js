
/* =========================================
   GG VINTAGE
   SECURE PASSWORD RECOVERY
========================================= */

const resetForm = document.getElementById("resetPasswordForm");
const resetMessage = document.getElementById("resetMessage");
const resetButton = document.getElementById("resetButton");

let recoverySessionReady = false;

function showResetMessage(message, color = "#d6a329") {
    if (!resetMessage) return;

    resetMessage.textContent = message;
    resetMessage.style.color = color;
}

/* =========================================
   1. VERIFY PASSWORD RECOVERY SESSION
========================================= */

async function initializePasswordRecovery() {

    const client = window.ggSupabase;

    if (!client) {
        showResetMessage(
            "Database connection unavailable. Please refresh.",
            "#ff7777"
        );
        return;
    }

    showResetMessage("Verifying password recovery link...");

    try {

        const { data, error } = await client.auth.getSession();

        if (error) throw error;

        if (!data.session) {

            recoverySessionReady = false;

            showResetMessage(
                "Your password recovery session is missing or expired. Please request a new reset email.",
                "#ff7777"
            );

            resetButton.disabled = true;

            return;
        }

        recoverySessionReady = true;
        resetButton.disabled = false;

        showResetMessage(
            "Recovery verified. You can now create a new password."
        );

    } catch (error) {

        console.error("RECOVERY SESSION ERROR:", error);

        showResetMessage(
            "Unable to verify recovery session: " + error.message,
            "#ff7777"
        );

    }
}

/* =========================================
   2. UPDATE ADMIN PASSWORD
========================================= */

if (resetForm) {

    resetForm.addEventListener("submit", async function(event) {

        event.preventDefault();

        const client = window.ggSupabase;

        if (!client) {
            showResetMessage(
                "Supabase is not connected.",
                "#ff7777"
            );
            return;
        }

        if (!recoverySessionReady) {
            showResetMessage(
                "Your recovery session is not valid. Request a new reset email.",
                "#ff7777"
            );
            return;
        }

        const newPassword =
            document.getElementById("newPassword").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        if (newPassword.length < 8) {
            showResetMessage(
                "Password must contain at least 8 characters.",
                "#ff7777"
            );
            return;
        }

        if (newPassword !== confirmPassword) {
            showResetMessage(
                "Passwords do not match.",
                "#ff7777"
            );
            return;
        }

        resetButton.disabled = true;
        resetButton.textContent = "UPDATING...";

        try {

            const { data, error } = await client.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            if (!data.user) {
                throw new Error("Password update could not be verified.");
            }

            recoverySessionReady = false;

            showResetMessage(
                "Password updated successfully. Returning to administrator login..."
            );

            resetForm.reset();

            await client.auth.signOut();

            setTimeout(function() {
                window.location.replace("admin.html");
            }, 2000);

        } catch (error) {

            console.error("PASSWORD UPDATE ERROR:", error);

            showResetMessage(
                error.message || "Unable to update password.",
                "#ff7777"
            );

        } finally {

            resetButton.disabled = !recoverySessionReady;
            resetButton.textContent = "UPDATE PASSWORD";

        }

    });

}

/* =========================================
   3. START RECOVERY
========================================= */

initializePasswordRecovery();

console.log("GG VINTAGE: Password recovery initialized.");
