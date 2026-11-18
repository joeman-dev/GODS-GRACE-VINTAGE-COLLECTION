
/* ==========================================
   GOD'S GRACE VINTAGE COLLECTION
   STAGE 5 — SUPABASE CONNECTION
========================================== */

console.log("GG VINTAGE: Loading Supabase connection...");

// ==========================================
// 1. SUPABASE PROJECT CREDENTIALS
// ==========================================

const SUPABASE_URL =
    "https://fbatajpophlkojgnhudc.supabase.co";

const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_4bgJKx6YxmrZSrcYFAaaaA_K5jKnHa1";

// ==========================================
// 2. CHECK SUPABASE LIBRARY
// ==========================================

if (!window.supabase || !window.supabase.createClient) {

    console.error(
        "GG VINTAGE ERROR: Supabase library was not loaded."
    );

} else {

    // ==========================================
    // 3. CREATE SUPABASE CLIENT
    // ==========================================

    const ggSupabase = window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_PUBLISHABLE_KEY
    );

    // Make the client available to other scripts.
    window.ggSupabase = ggSupabase;

    console.log("GG VINTAGE: Supabase client created successfully.");


    // ==========================================
    // 4. TEST DATABASE CONNECTION
    // ==========================================

    async function testSupabaseConnection() {

        console.log("GG VINTAGE: Testing database connection...");

        try {

            const { data, error } = await ggSupabase
                .from("products")
                .select("*")
                .limit(5);

            if (error) {
                throw error;
            }

            console.log(
                "SUCCESS: Connected to GG Vintage Supabase database!"
            );

            console.log("Products returned:", data);

            console.log(
                "Number of products retrieved:",
                data.length
            );

            return data;

        } catch (error) {

            console.error(
                "GG VINTAGE DATABASE ERROR:",
                error.message
            );

            return null;

        }

    }


    // ==========================================
    // 5. RUN CONNECTION TEST
    // ==========================================

    window.testSupabaseConnection = testSupabaseConnection;

    testSupabaseConnection();

}

console.log("GG VINTAGE: Supabase script execution completed.");
