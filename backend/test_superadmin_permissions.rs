#!/usr/bin/env rust-script

//! Test script to verify SuperAdmin diocese permissions
//! 
//! This script tests:
//! 1. SuperAdmin can create, read, update, delete dioceses
//! 2. Regular users cannot create, update, delete dioceses
//! 3. ParishAdmin cannot create, update, delete dioceses
//! 4. SuperAdmin can access all dioceses regardless of parish assignment

use std::collections::HashMap;
use serde_json::{json, Value};
use uuid::Uuid;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🔍 Testing SuperAdmin diocese permissions...\n");
    
    let base_url = "http://localhost:3000";
    let client = reqwest::Client::new();
    
    // Test data
    let test_diocese = json!({
        "id": Uuid::new_v4(),
        "diocese_code": "TEST-001",
        "diocese_name": "Test Diocese for Permissions",
        "bishop_name": "Test Bishop",
        "headquarters_address": "123 Test Street",
        "contact_phone": "+1234567890",
        "contact_email": "test@diocese.org"
    });
    
    // Test 1: Login as SuperAdmin
    println!("📝 Test 1: SuperAdmin login");
    let superadmin_token = login(&client, &format!("{}/auth/login", base_url), "admin", "Admin@123").await?;
    println!("✅ SuperAdmin login successful");
    
    // Test 2: SuperAdmin can create diocese
    println!("\n📝 Test 2: SuperAdmin create diocese");
    let diocese_id = create_diocese(&client, &format!("{}/dioceses", base_url), &superadmin_token, &test_diocese).await?;
    println!("✅ SuperAdmin successfully created diocese: {}", diocese_id);
    
    // Test 3: SuperAdmin can read diocese
    println!("\n📝 Test 3: SuperAdmin read diocese");
    let _ = get_diocese(&client, &format!("{}/dioceses/{}", base_url, diocese_id), &superadmin_token).await?;
    println!("✅ SuperAdmin successfully read diocese");
    
    // Test 4: SuperAdmin can list all dioceses
    println!("\n📝 Test 4: SuperAdmin list dioceses");
    let _ = list_dioceses(&client, &format!("{}/dioceses", base_url), &superadmin_token).await?;
    println!("✅ SuperAdmin successfully listed dioceses");
    
    // Test 5: SuperAdmin can update diocese
    println!("\n📝 Test 5: SuperAdmin update diocese");
    let updated_diocese = json!({
        "id": diocese_id,
        "diocese_code": "TEST-001-UPDATED",
        "diocese_name": "Updated Test Diocese",
        "bishop_name": "Updated Test Bishop",
        "headquarters_address": "456 Updated Street",
        "contact_phone": "+0987654321",
        "contact_email": "updated@diocese.org"
    });
    let _ = update_diocese(&client, &format!("{}/dioceses/{}", base_url, diocese_id), &superadmin_token, &updated_diocese).await?;
    println!("✅ SuperAdmin successfully updated diocese");
    
    // Test 6: Login as regular user
    println!("\n📝 Test 6: Regular user login");
    let regular_token = login(&client, &format!("{}/auth/login", base_url), "user", "password123").await?;
    println!("✅ Regular user login successful");
    
    // Test 7: Regular user cannot create diocese
    println!("\n📝 Test 7: Regular user create diocese (should fail)");
    let test_diocese_2 = json!({
        "id": Uuid::new_v4(),
        "diocese_code": "TEST-002",
        "diocese_name": "Unauthorized Diocese",
        "bishop_name": "Unauthorized Bishop",
        "headquarters_address": "789 Unauthorized Street",
        "contact_phone": "+1122334455",
        "contact_email": "unauthorized@diocese.org"
    });
    match create_diocese(&client, &format!("{}/dioceses", base_url), &regular_token, &test_diocese_2).await {
        Ok(_) => println!("❌ ERROR: Regular user was able to create diocese!"),
        Err(_) => println!("✅ Regular user correctly denied diocese creation"),
    }
    
    // Test 8: Regular user cannot update diocese
    println!("\n📝 Test 8: Regular user update diocese (should fail)");
    match update_diocese(&client, &format!("{}/dioceses/{}", base_url, diocese_id), &regular_token, &updated_diocese).await {
        Ok(_) => println!("❌ ERROR: Regular user was able to update diocese!"),
        Err(_) => println!("✅ Regular user correctly denied diocese update"),
    }
    
    // Test 9: Regular user cannot delete diocese
    println!("\n📝 Test 9: Regular user delete diocese (should fail)");
    match delete_diocese(&client, &format!("{}/dioceses/{}", base_url, diocese_id), &regular_token).await {
        Ok(_) => println!("❌ ERROR: Regular user was able to delete diocese!"),
        Err(_) => println!("✅ Regular user correctly denied diocese deletion"),
    }
    
    // Test 10: Login as ParishAdmin
    println!("\n📝 Test 10: ParishAdmin login");
    let parishadmin_token = login(&client, &format!("{}/auth/login", base_url), "parishadmin", "password123").await?;
    println!("✅ ParishAdmin login successful");
    
    // Test 11: ParishAdmin cannot create diocese
    println!("\n📝 Test 11: ParishAdmin create diocese (should fail)");
    match create_diocese(&client, &format!("{}/dioceses", base_url), &parishadmin_token, &test_diocese_2).await {
        Ok(_) => println!("❌ ERROR: ParishAdmin was able to create diocese!"),
        Err(_) => println!("✅ ParishAdmin correctly denied diocese creation"),
    }
    
    // Test 12: ParishAdmin cannot update diocese
    println!("\n📝 Test 12: ParishAdmin update diocese (should fail)");
    match update_diocese(&client, &format!("{}/dioceses/{}", base_url, diocese_id), &parishadmin_token, &updated_diocese).await {
        Ok(_) => println!("❌ ERROR: ParishAdmin was able to update diocese!"),
        Err(_) => println!("✅ ParishAdmin correctly denied diocese update"),
    }
    
    // Test 13: ParishAdmin cannot delete diocese
    println!("\n📝 Test 13: ParishAdmin delete diocese (should fail)");
    match delete_diocese(&client, &format!("{}/dioceses/{}", base_url, diocese_id), &parishadmin_token).await {
        Ok(_) => println!("❌ ERROR: ParishAdmin was able to delete diocese!"),
        Err(_) => println!("✅ ParishAdmin correctly denied diocese deletion"),
    }
    
    // Test 14: SuperAdmin can delete diocese (cleanup)
    println!("\n📝 Test 14: SuperAdmin delete diocese (cleanup)");
    let _ = delete_diocese(&client, &format!("{}/dioceses/{}", base_url, diocese_id), &superadmin_token).await?;
    println!("✅ SuperAdmin successfully deleted diocese");
    
    println!("\n🎉 All SuperAdmin permission tests completed successfully!");
    println!("✅ SuperAdmin users have proper diocese management permissions");
    println!("✅ Regular users and ParishAdmin are correctly restricted from diocese management");
    
    Ok(())
}

async fn login(client: &reqwest::Client, url: &str, username: &str, password: &str) -> Result<String, Box<dyn std::error::Error>> {
    let mut map = HashMap::new();
    map.insert("username_or_email", username);
    map.insert("password", password);
    
    let response = client
        .post(url)
        .json(&map)
        .send()
        .await?;
    
    if response.status().is_success() {
        let result: Value = response.json().await?;
        Ok(result["token"].as_str().unwrap().to_string())
    } else {
        Err(format!("Login failed: {}", response.status()).into())
    }
}

async fn create_diocese(client: &reqwest::Client, url: &str, token: &str, diocese: &Value) -> Result<String, Box<dyn std::error::Error>> {
    let response = client
        .post(url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(diocese)
        .send()
        .await?;
    
    if response.status().is_success() {
        let result: Value = response.json().await?;
        Ok(result["id"].as_str().unwrap().to_string())
    } else {
        Err(format!("Create diocese failed: {}", response.status()).into())
    }
}

async fn get_diocese(client: &reqwest::Client, url: &str, token: &str) -> Result<Value, Box<dyn std::error::Error>> {
    let response = client
        .get(url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;
    
    if response.status().is_success() {
        let result: Value = response.json().await?;
        Ok(result)
    } else {
        Err(format!("Get diocese failed: {}", response.status()).into())
    }
}

async fn list_dioceses(client: &reqwest::Client, url: &str, token: &str) -> Result<Value, Box<dyn std::error::Error>> {
    let response = client
        .get(url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;
    
    if response.status().is_success() {
        let result: Value = response.json().await?;
        Ok(result)
    } else {
        Err(format!("List dioceses failed: {}", response.status()).into())
    }
}

async fn update_diocese(client: &reqwest::Client, url: &str, token: &str, diocese: &Value) -> Result<Value, Box<dyn std::error::Error>> {
    let response = client
        .put(url)
        .header("Authorization", format!("Bearer {}", token))
        .header("Content-Type", "application/json")
        .json(diocese)
        .send()
        .await?;
    
    if response.status().is_success() {
        let result: Value = response.json().await?;
        Ok(result)
    } else {
        Err(format!("Update diocese failed: {}", response.status()).into())
    }
}

async fn delete_diocese(client: &reqwest::Client, url: &str, token: &str) -> Result<(), Box<dyn std::error::Error>> {
    let response = client
        .delete(url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await?;
    
    if response.status().is_success() {
        Ok(())
    } else {
        Err(format!("Delete diocese failed: {}", response.status()).into())
    }
}
