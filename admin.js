
/* =========================================
   GG VINTAGE ADMIN LOGIN
   SUPABASE AUTHENTICATION
========================================= */

const loginForm = document.getElementById("adminLoginForm");
const loginButton = document.getElementById("loginButton");
const loginMessage = document.getElementById("loginMessage");

const forgotPasswordButton = document.getElementById(
    "forgotPasswordButton"
);

function showLoginMessage(message, color = "#d6a329") {
    if (!loginMessage) return;

    loginMessage.textContent = message;
    loginMessage.style.color = color;
}

/* =========================================
   1. VERIFY EXISTING ADMIN SESSION
========================================= */

async function verifyAdminSession() {
    const client = window.ggSupabase;

    if (!client) {
        showLoginMessage(
            "Database connection unavailable. Check supabase.js.",
            "#ff7777"
        );
        return;
    }

    try {
        const { data, error } = await client.auth.getSession();

        if (error) throw error;

        const session = data.session;

        if (!session) return;

        const { data: profile, error: profileError } = await client
            .from("profiles")
            .select("full_name, role")
            .eq("user_id", session.user.id)
            .maybeSingle();

        if (profileError) throw profileError;

        if (!profile || profile.role !== "admin") {
            await client.auth.signOut();

            showLoginMessage(
                "Administrator access could not be verified.",
                "#ff7777"
            );

            return;
        }

        window.location.replace("admin-dashboard.html");

    } catch (error) {
        console.error("ADMIN SESSION ERROR:", error);

        showLoginMessage(
            "Session verification failed: " + error.message,
            "#ff7777"
        );
    }
}

/* =========================================
   2. ADMIN LOGIN
========================================= */

if (loginForm) {
    loginForm.addEventListener("submit", async function(event) {
        event.preventDefault();

        const client = window.ggSupabase;

        if (!client) {
            showLoginMessage(
                "Supabase is not connected.",
                "#ff7777"
            );
            return;
        }

        const email = document
            .getElementById("adminEmail")
            .value.trim();

        const password = document
            .getElementById("adminPassword")
            .value;

        if (!email || !password) {
            showLoginMessage(
                "Please enter your email and password.",
                "#ff7777"
            );
            return;
        }

        loginButton.disabled = true;
        loginButton.textContent = "SIGNING IN...";

        showLoginMessage("Checking administrator credentials...");

        try {
            const { data, error } = await client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            const { data: profile, error: profileError } = await client
                .from("profiles")
                .select("full_name, role")
                .eq("user_id", data.user.id)
                .maybeSingle();

            if (profileError) throw profileError;

            if (!profile || profile.role !== "admin") {
                await client.auth.signOut();

                throw new Error(
                    "This account does not have administrator permission."
                );
            }

            showLoginMessage(
                "Login successful. Opening dashboard..."
            );

            window.location.replace("admin-dashboard.html");

        } catch (error) {
            console.error("ADMIN LOGIN ERROR:", error);

            showLoginMessage(
                error.message || "Login failed. Please try again.",
                "#ff7777"
            );

        } finally {
            loginButton.disabled = false;
            loginButton.textContent = "SIGN IN";
        }
    });
}

/* =========================================
   3. FORGOT PASSWORD
========================================= */

if (forgotPasswordButton) {
    forgotPasswordButton.addEventListener("click", async function() {

        const client = window.ggSupabase;

        if (!client) {
            showLoginMessage(
                "Supabase is not connected.",
                "#ff7777"
            );
            return;
        }

        const emailInput = document.getElementById("adminEmail");

        const email = emailInput
            ? emailInput.value.trim()
            : "";

        if (!email) {
            showLoginMessage(
                "Enter your administrator email first.",
                "#ff7777"
            );

            if (emailInput) emailInput.focus();

            return;
        }

        forgotPasswordButton.disabled = true;
        forgotPasswordButton.textContent = "SENDING EMAIL...";

        showLoginMessage("Sending password reset email...");

        try {
            const { error } = await client.auth.resetPasswordForEmail(
                email,
                {
                    redirectTo:
                        window.location.origin +
                        "/reset-password.html"
                }
            );

            if (error) throw error;

            showLoginMessage(
                "If the account exists, a password reset email has been sent. Check your inbox."
            );

        } catch (error) {
            console.error("PASSWORD RESET ERROR:", error);

            showLoginMessage(
                error.message || "Unable to send reset email.",
                "#ff7777"
            );

        } finally {
            forgotPasswordButton.disabled = false;
            forgotPasswordButton.textContent = "FORGOT PASSWORD?";
        }
    });
}

/* =========================================
   4. INITIALIZE LOGIN PAGE
========================================= */

verifyAdminSession();

console.log("GG VINTAGE: Admin login initialized.");
