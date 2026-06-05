// import { createClient } from "@supabase/supabase-js";
// import dotenv from "dotenv";

// dotenv.config({ path: ".env.local" });

// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
// );

// async function test() {
//   const { data, error } = await supabase
//     .from("transactions")
//     .select(`*, category:categories(*)`)
//     .limit(5)
//     .order('created_at', { ascending: false });
    
//   if (error) {
//     console.error("Error:", error);
//   } else {
//     console.log("Latest Transactions:");
//     data.forEach(t => {
//       console.log(`- ID: ${t.id}, Date: ${t.transaction_date}, Amount: ${t.amount}, CatID: ${t.category_id}`);
//     });
//   }
// }

// test();
