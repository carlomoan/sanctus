#!/bin/bash

# Test script to verify SuperAdmin diocese permissions
# This script tests:
# 1. SuperAdmin can create, read, update, delete dioceses
# 2. Regular users cannot create, update, delete dioceses
# 3. ParishAdmin cannot create, update, delete dioceses

set -e

BASE_URL="http://localhost:3000"
echo "🔍 Testing SuperAdmin diocese permissions..."
echo "Base URL: $BASE_URL"

# Function to login and get token
login() {
    local username=$1
    local password=$2
    echo "🔐 Logging in as: $username"
    
    local response=$(curl -s -X POST "$BASE_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"username_or_email\":\"$username\",\"password\":\"$password\"}")
    
    local token=$(echo "$response" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    if [ -z "$token" ]; then
        echo "❌ Login failed for $username"
        echo "Response: $response"
        exit 1
    fi
    echo "✅ Login successful for $username"
    echo "$token"
}

# Function to create diocese
create_diocese() {
    local token=$1
    local diocese_data=$2
    local test_name=$3
    
    echo "📝 $test_name: Creating diocese..."
    
    local response=$(curl -s -w "%{http_code}" -X POST "$BASE_URL/dioceses" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$diocese_data")
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "201" ]; then
        local diocese_id=$(echo "$body" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
        echo "✅ $test_name: Diocese created successfully: $diocese_id"
        echo "$diocese_id"
    else
        echo "❌ $test_name: Failed to create diocese (HTTP $http_code)"
        echo "Response: $body"
        echo "FAILED"
    fi
}

# Function to update diocese
update_diocese() {
    local token=$1
    local diocese_id=$2
    local diocese_data=$3
    local test_name=$4
    
    echo "📝 $test_name: Updating diocese..."
    
    local response=$(curl -s -w "%{http_code}" -X PUT "$BASE_URL/dioceses/$diocese_id" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$diocese_data")
    
    local http_code="${response: -3}"
    local body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo "✅ $test_name: Diocese updated successfully"
    else
        echo "❌ $test_name: Failed to update diocese (HTTP $http_code)"
        echo "Response: $body"
        echo "FAILED"
    fi
}

# Function to delete diocese
delete_diocese() {
    local token=$1
    local diocese_id=$2
    local test_name=$3
    
    echo "📝 $test_name: Deleting diocese..."
    
    local response=$(curl -s -w "%{http_code}" -X DELETE "$BASE_URL/dioceses/$diocese_id" \
        -H "Authorization: Bearer $token")
    
    local http_code="${response: -3}"
    
    if [ "$http_code" = "204" ]; then
        echo "✅ $test_name: Diocese deleted successfully"
    else
        echo "❌ $test_name: Failed to delete diocese (HTTP $http_code)"
        echo "FAILED"
    fi
}

# Test data
TEST_DIOCESE='{
    "id": "'$(uuidgen)'",
    "diocese_code": "TEST-001",
    "diocese_name": "Test Diocese for Permissions",
    "bishop_name": "Test Bishop",
    "headquarters_address": "123 Test Street",
    "contact_phone": "+1234567890",
    "contact_email": "test@diocese.org"
}'

UPDATED_DIOCESE='{
    "diocese_code": "TEST-001-UPDATED",
    "diocese_name": "Updated Test Diocese",
    "bishop_name": "Updated Test Bishop",
    "headquarters_address": "456 Updated Street",
    "contact_phone": "+0987654321",
    "contact_email": "updated@diocese.org"
}'

UNAUTHORIZED_DIOCESE='{
    "id": "'$(uuidgen)'",
    "diocese_code": "TEST-002",
    "diocese_name": "Unauthorized Diocese",
    "bishop_name": "Unauthorized Bishop",
    "headquarters_address": "789 Unauthorized Street",
    "contact_phone": "+1122334455",
    "contact_email": "unauthorized@diocese.org"
}'

# Test 1: SuperAdmin login
echo ""
echo "=== Test 1: SuperAdmin login ==="
SUPERADMIN_TOKEN=$(login "admin" "Admin@123")

# Test 2: SuperAdmin create diocese
echo ""
echo "=== Test 2: SuperAdmin create diocese ==="
DIOCESE_ID=$(create_diocese "$SUPERADMIN_TOKEN" "$TEST_DIOCESE" "SuperAdmin")

if [ "$DIOCESE_ID" = "FAILED" ]; then
    echo "❌ Critical: SuperAdmin cannot create diocese"
    exit 1
fi

# Test 3: SuperAdmin update diocese
echo ""
echo "=== Test 3: SuperAdmin update diocese ==="
UPDATE_RESULT=$(update_diocese "$SUPERADMIN_TOKEN" "$DIOCESE_ID" "$UPDATED_DIOCESE" "SuperAdmin")

if [ "$UPDATE_RESULT" = "FAILED" ]; then
    echo "❌ Critical: SuperAdmin cannot update diocese"
    exit 1
fi

# Test 4: Regular user login
echo ""
echo "=== Test 4: Regular user login ==="
REGULAR_TOKEN=$(login "user" "password123")

# Test 5: Regular user cannot create diocese
echo ""
echo "=== Test 5: Regular user create diocese (should fail) ==="
REGULAR_CREATE_RESULT=$(create_diocese "$REGULAR_TOKEN" "$UNAUTHORIZED_DIOCESE" "Regular user")

if [ "$REGULAR_CREATE_RESULT" != "FAILED" ]; then
    echo "❌ SECURITY ISSUE: Regular user was able to create diocese!"
    exit 1
else
    echo "✅ Regular user correctly denied diocese creation"
fi

# Test 6: Regular user cannot update diocese
echo ""
echo "=== Test 6: Regular user update diocese (should fail) ==="
REGULAR_UPDATE_RESULT=$(update_diocese "$REGULAR_TOKEN" "$DIOCESE_ID" "$UPDATED_DIOCESE" "Regular user")

if [ "$REGULAR_UPDATE_RESULT" != "FAILED" ]; then
    echo "❌ SECURITY ISSUE: Regular user was able to update diocese!"
    exit 1
else
    echo "✅ Regular user correctly denied diocese update"
fi

# Test 7: Regular user cannot delete diocese
echo ""
echo "=== Test 7: Regular user delete diocese (should fail) ==="
REGULAR_DELETE_RESULT=$(delete_diocese "$REGULAR_TOKEN" "$DIOCESE_ID" "Regular user")

if [ "$REGULAR_DELETE_RESULT" != "FAILED" ]; then
    echo "❌ SECURITY ISSUE: Regular user was able to delete diocese!"
    exit 1
else
    echo "✅ Regular user correctly denied diocese deletion"
fi

# Test 8: ParishAdmin login
echo ""
echo "=== Test 8: ParishAdmin login ==="
PARISHADMIN_TOKEN=$(login "parishadmin" "password123")

# Test 9: ParishAdmin cannot create diocese
echo ""
echo "=== Test 9: ParishAdmin create diocese (should fail) ==="
PARISHADMIN_CREATE_RESULT=$(create_diocese "$PARISHADMIN_TOKEN" "$UNAUTHORIZED_DIOCESE" "ParishAdmin")

if [ "$PARISHADMIN_CREATE_RESULT" != "FAILED" ]; then
    echo "❌ SECURITY ISSUE: ParishAdmin was able to create diocese!"
    exit 1
else
    echo "✅ ParishAdmin correctly denied diocese creation"
fi

# Test 10: ParishAdmin cannot update diocese
echo ""
echo "=== Test 10: ParishAdmin update diocese (should fail) ==="
PARISHADMIN_UPDATE_RESULT=$(update_diocese "$PARISHADMIN_TOKEN" "$DIOCESE_ID" "$UPDATED_DIOCESE" "ParishAdmin")

if [ "$PARISHADMIN_UPDATE_RESULT" != "FAILED" ]; then
    echo "❌ SECURITY ISSUE: ParishAdmin was able to update diocese!"
    exit 1
else
    echo "✅ ParishAdmin correctly denied diocese update"
fi

# Test 11: ParishAdmin cannot delete diocese
echo ""
echo "=== Test 11: ParishAdmin delete diocese (should fail) ==="
PARISHADMIN_DELETE_RESULT=$(delete_diocese "$PARISHADMIN_TOKEN" "$DIOCESE_ID" "ParishAdmin")

if [ "$PARISHADMIN_DELETE_RESULT" != "FAILED" ]; then
    echo "❌ SECURITY ISSUE: ParishAdmin was able to delete diocese!"
    exit 1
else
    echo "✅ ParishAdmin correctly denied diocese deletion"
fi

# Test 12: SuperAdmin delete diocese (cleanup)
echo ""
echo "=== Test 12: SuperAdmin delete diocese (cleanup) ==="
SUPERADMIN_DELETE_RESULT=$(delete_diocese "$SUPERADMIN_TOKEN" "$DIOCESE_ID" "SuperAdmin")

if [ "$SUPERADMIN_DELETE_RESULT" = "FAILED" ]; then
    echo "❌ Critical: SuperAdmin cannot delete diocese"
    exit 1
fi

echo ""
echo "🎉 All SuperAdmin permission tests completed successfully!"
echo "✅ SuperAdmin users have proper diocese management permissions"
echo "✅ Regular users and ParishAdmin are correctly restricted from diocese management"
echo ""
echo "🔒 Security verification: PASSED"
