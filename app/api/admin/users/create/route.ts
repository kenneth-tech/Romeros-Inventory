import { createClient } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated and is admin
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", authUser.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Only admins can create users" },
        { status: 403 }
      );
    }

    // Get request body
    const {
      email,
      password,
      firstName,
      lastName,
      role,
      branchIds,
    }: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      role: "admin" | "staff";
      branchIds: string[];
    } = await request.json();

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, firstName, lastName" },
        { status: 400 }
      );
    }

    // Create user with Supabase Auth
    const { data: newUser, error: authError } =
      await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

    if (authError || !newUser.user) {
      return NextResponse.json(
        { error: authError?.message || "Failed to create user" },
        { status: 400 }
      );
    }

    // Create profile
    const { error: profileError } = await supabase.from("profiles").insert({
      id: newUser.user.id,
      first_name: firstName,
      last_name: lastName,
      role: role || "staff",
    });

    if (profileError) {
      // Clean up the auth user if profile creation fails
      await supabase.auth.admin.deleteUser(newUser.user.id);
      return NextResponse.json(
        { error: "Failed to create profile: " + profileError.message },
        { status: 400 }
      );
    }

    // Assign branches if provided
    if (branchIds && branchIds.length > 0) {
      const { error: branchError } = await supabase
        .from("user_branches")
        .insert(
          branchIds.map((branchId) => ({
            user_id: newUser.user.id,
            branch_id: branchId,
          }))
        );

      if (branchError) {
        console.error("Failed to assign branches:", branchError);
      }
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        firstName,
        lastName,
        role,
      },
    });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
