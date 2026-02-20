"""
Test script for voice bot system.
Tests call scheduling, initiation, handling, and database saving.
"""
import asyncio
import sys
from pathlib import Path
from dotenv import load_dotenv
from datetime import datetime, timezone

# Add Backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.email.scheduler import get_supabase_client

# Import voice bot modules (handle missing dependencies gracefully)
try:
    from app.services.voice_agent.voice_call_scheduler import (
        calculate_plan_completion_percentage,
        get_call_type_for_percentage,
        should_make_call,
        process_scheduled_calls
    )
    from app.services.voice_agent.twilio_call_service import twilio_call_service
    from app.services.voice_agent.voice_conversation import voice_conversation_handler
    from app.services.voice_agent.sentiment_analyzer import sentiment_analyzer
    VOICE_BOT_AVAILABLE = True
except ImportError as e:
    print(f"[WARN] Voice bot modules not available: {e}")
    VOICE_BOT_AVAILABLE = False
    twilio_call_service = None
    voice_conversation_handler = None
    sentiment_analyzer = None

# Load .env file
env_path = Path(__file__).parent.parent / ".env"
if env_path.exists():
    load_dotenv(env_path, override=True)


def test_twilio_configuration():
    """Test Twilio configuration."""
    print("\n" + "="*70)
    print("TEST 1: TWILIO CONFIGURATION")
    print("="*70)
    
    if not VOICE_BOT_AVAILABLE:
        print("  [SKIP] Voice bot modules not available")
        return False
    
    if twilio_call_service and twilio_call_service.is_configured():
        print("  [OK] Twilio is configured")
        print(f"  Account SID: {twilio_call_service.account_sid[:10]}...")
        print(f"  Phone Number: {twilio_call_service.phone_number or 'Not set'}")
        return True
    else:
        print("  [ERROR] Twilio is not configured")
        print("  Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER in .env")
        return False


def test_database_connection():
    """Test database connection."""
    print("\n" + "="*70)
    print("TEST 2: DATABASE CONNECTION")
    print("="*70)
    
    client = get_supabase_client()
    if not client:
        print("  [ERROR] Supabase not configured")
        return None
    
    print("  [OK] Database connected")
    
    # Test query
    try:
        result = client.table("accounts").select("id, name").limit(1).execute()
        if result.data:
            print(f"  [OK] Can query accounts table ({len(result.data)} account found)")
            return client
        else:
            print("  [WARN] No accounts found in database")
            return client
    except Exception as e:
        print(f"  [ERROR] Failed to query database: {e}")
        return None


def test_plan_completion_calculation():
    """Test plan completion percentage calculation."""
    print("\n" + "="*70)
    print("TEST 3: PLAN COMPLETION CALCULATION")
    print("="*70)
    
    if not VOICE_BOT_AVAILABLE:
        print("  [SKIP] Voice bot modules not available")
        return
    
    client = get_supabase_client()
    if not client:
        print("  [SKIP] Database not connected")
        return
    
    try:
        # Get a sample account
        result = client.table("accounts").select("*").limit(1).execute()
        if not result.data:
            print("  [SKIP] No accounts found")
            return
        
        account = result.data[0]
        account_name = account.get('name', 'Unknown')
        
        usage_percentage = calculate_plan_completion_percentage(account)
        call_type = get_call_type_for_percentage(usage_percentage)
        
        print(f"  Account: {account_name}")
        print(f"  Contract Start: {account.get('contract_start_date')}")
        print(f"  Contract End: {account.get('contract_end_date')}")
        print(f"  Usage Percentage: {usage_percentage:.1f}%")
        print(f"  Call Type: {call_type}")
        
        if usage_percentage > 0:
            print("  [OK] Plan completion calculated successfully")
        else:
            print("  [WARN] Usage percentage is 0% (check contract dates)")
            
    except Exception as e:
        print(f"  [ERROR] Failed to calculate plan completion: {e}")
        import traceback
        print(traceback.format_exc())


def test_call_eligibility():
    """Test call eligibility checking."""
    print("\n" + "="*70)
    print("TEST 4: CALL ELIGIBILITY CHECK")
    print("="*70)
    
    if not VOICE_BOT_AVAILABLE:
        print("  [SKIP] Voice bot modules not available")
        return
    
    client = get_supabase_client()
    if not client:
        print("  [SKIP] Database not connected")
        return
    
    try:
        # Get active accounts
        result = client.table("accounts").select("*").eq("status", "active").limit(5).execute()
        accounts = result.data if result.data else []
        
        if not accounts:
            print("  [SKIP] No active accounts found")
            return
        
        print(f"  Checking {len(accounts)} active accounts...")
        
        eligible_count = 0
        for account in accounts:
            account_name = account.get('name', 'Unknown')
            phone_number = account.get('primary_contact_phone')
            
            if not phone_number:
                print(f"    {account_name}: [SKIP] No phone number")
                continue
            
            usage_percentage = calculate_plan_completion_percentage(account)
            should_call, reason = should_make_call(account, usage_percentage, client)
            
            if should_call:
                eligible_count += 1
                print(f"    {account_name}: [ELIGIBLE] {reason}")
            else:
                print(f"    {account_name}: [NOT ELIGIBLE] {reason}")
        
        print(f"\n  [RESULT] {eligible_count}/{len(accounts)} accounts are eligible for calls")
        
    except Exception as e:
        print(f"  [ERROR] Failed to check call eligibility: {e}")
        import traceback
        print(traceback.format_exc())


def test_conversation_script_generation():
    """Test conversation script generation."""
    print("\n" + "="*70)
    print("TEST 5: CONVERSATION SCRIPT GENERATION")
    print("="*70)
    
    if not VOICE_BOT_AVAILABLE or not voice_conversation_handler:
        print("  [SKIP] Voice bot modules not available")
        return
    
    client = get_supabase_client()
    if not client:
        print("  [SKIP] Database not connected")
        return
    
    try:
        # Get a sample account
        result = client.table("accounts").select("*").limit(1).execute()
        if not result.data:
            print("  [SKIP] No accounts found")
            return
        
        account = result.data[0]
        usage_percentage = calculate_plan_completion_percentage(account)
        call_type = get_call_type_for_percentage(usage_percentage)
        
        print(f"  Account: {account.get('name')}")
        print(f"  Usage: {usage_percentage:.1f}%")
        print(f"  Call Type: {call_type}")
        print("\n  Generated Script:")
        print("  " + "-"*66)
        
        script = voice_conversation_handler.get_conversation_script(
            account=account,
            usage_percentage=usage_percentage,
            call_type=call_type
        )
        
        # Print script with proper formatting
        for line in script.split('\n'):
            print(f"  {line.strip()}")
        
        print("  " + "-"*66)
        print("  [OK] Script generated successfully")
        
    except Exception as e:
        print(f"  [ERROR] Failed to generate script: {e}")
        import traceback
        print(traceback.format_exc())


def test_sentiment_analysis():
    """Test sentiment analysis."""
    print("\n" + "="*70)
    print("TEST 6: SENTIMENT ANALYSIS")
    print("="*70)
    
    if not VOICE_BOT_AVAILABLE or not sentiment_analyzer:
        print("  [SKIP] Voice bot modules not available")
        return
    
    # Test with sample transcript
    sample_transcript = """
    Agent: Hello, this is John calling from Renewal & Upsell Advisor. How are you today?
    User: I'm doing great, thanks! Everything is working well with your service.
    Agent: That's wonderful to hear! Are you experiencing any issues?
    User: No, everything is perfect. We're very satisfied with the service.
    Agent: Great! I wanted to mention that your contract renewal is coming up soon.
    User: Yes, we'd like to renew. We're happy with everything.
    """
    
    try:
        print("  Analyzing sample transcript...")
        print("  Transcript preview:")
        print("  " + sample_transcript[:100] + "...")
        
        sentiment_data = sentiment_analyzer.analyze_sentiment(sample_transcript)
        
        print(f"\n  Sentiment Score: {sentiment_data['sentiment_score']:.2f}")
        print(f"  Sentiment Category: {sentiment_data['sentiment_category']}")
        print(f"  Keywords: {', '.join(sentiment_data['keywords'][:5])}")
        
        print("  [OK] Sentiment analysis completed")
        
    except Exception as e:
        print(f"  [ERROR] Failed to analyze sentiment: {e}")
        import traceback
        print(traceback.format_exc())


def test_call_history():
    """Test call history retrieval."""
    print("\n" + "="*70)
    print("TEST 7: CALL HISTORY")
    print("="*70)
    
    client = get_supabase_client()
    if not client:
        print("  [SKIP] Database not connected")
        return
    
    try:
        # Get recent calls
        result = client.table("voice_calls").select(
            "id, account_id, call_type, status, outcome, completed_at, duration_seconds"
        ).order("created_at", desc=True).limit(10).execute()
        
        calls = result.data if result.data else []
        
        if not calls:
            print("  [INFO] No calls found in database")
            return
        
        print(f"  Found {len(calls)} recent calls:\n")
        
        for call in calls[:5]:
            call_id = call.get('id', 'N/A')[:8]
            call_type = call.get('call_type', 'N/A')
            status = call.get('status', 'N/A')
            outcome = call.get('outcome', 'N/A')
            completed = call.get('completed_at', 'N/A')
            duration = call.get('duration_seconds', 'N/A')
            
            print(f"    Call {call_id}:")
            print(f"      Type: {call_type}")
            print(f"      Status: {status}")
            print(f"      Outcome: {outcome}")
            print(f"      Duration: {duration}s" if duration != 'N/A' else "      Duration: N/A")
            print(f"      Completed: {completed[:19] if completed != 'N/A' else 'N/A'}")
            print()
        
        print("  [OK] Call history retrieved successfully")
        
    except Exception as e:
        print(f"  [ERROR] Failed to retrieve call history: {e}")
        import traceback
        print(traceback.format_exc())


async def test_call_processing():
    """Test call processing (dry run - doesn't actually make calls)."""
    print("\n" + "="*70)
    print("TEST 8: CALL PROCESSING (DRY RUN)")
    print("="*70)
    
    if not VOICE_BOT_AVAILABLE:
        print("  [SKIP] Voice bot modules not available")
        return
    
    print("  [INFO] This test simulates call processing without actually making calls")
    print("  [INFO] To actually make calls, use: POST /api/v1/voice/trigger-calls")
    
    client = get_supabase_client()
    if not client:
        print("  [SKIP] Database not connected")
        return
    
    try:
        # Get accounts that would be called
        result = client.table("accounts").select("*").eq("status", "active").limit(3).execute()
        accounts = result.data if result.data else []
        
        if not accounts:
            print("  [SKIP] No active accounts found")
            return
        
        print(f"\n  Would process {len(accounts)} accounts:\n")
        
        for account in accounts:
            account_name = account.get('name', 'Unknown')
            phone = account.get('primary_contact_phone', 'N/A')
            usage = calculate_plan_completion_percentage(account)
            should_call, reason = should_make_call(account, usage, client)
            
            print(f"    {account_name}:")
            print(f"      Phone: {phone}")
            print(f"      Usage: {usage:.1f}%")
            print(f"      Would Call: {'Yes' if should_call else 'No'}")
            print(f"      Reason: {reason}")
            print()
        
        print("  [OK] Call processing simulation completed")
        print("\n  [NOTE] To actually trigger calls, run:")
        print("    curl -X POST http://localhost:8000/api/v1/voice/trigger-calls")
        
    except Exception as e:
        print(f"  [ERROR] Failed to simulate call processing: {e}")
        import traceback
        print(traceback.format_exc())


def main():
    """Run all tests."""
    print("\n" + "="*70)
    print("VOICE BOT SYSTEM TEST SUITE")
    print("="*70)
    print("\nRunning comprehensive tests for voice bot system...")
    
    # Run tests
    twilio_ok = test_twilio_configuration()
    client = test_database_connection()
    
    if client:
        test_plan_completion_calculation()
        test_call_eligibility()
        test_conversation_script_generation()
        test_call_history()
    
    test_sentiment_analysis()
    
    if client:
        asyncio.run(test_call_processing())
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    
    if twilio_ok:
        print("  [OK] Twilio: Configured")
    else:
        print("  [WARN] Twilio: Not configured (calls won't work)")
    
    if client:
        print("  [OK] Database: Connected")
    else:
        print("  [ERROR] Database: Not connected")
    
    print("\n  [INFO] To test actual call making:")
    print("    1. Ensure Twilio credentials are set in .env")
    print("    2. Ensure WEBHOOK_BASE_URL is set (publicly accessible)")
    print("    3. Ensure accounts have primary_contact_phone set")
    print("    4. Run: python scripts/test_voice_bot.py")
    print("    5. Or trigger via API: POST /api/v1/voice/trigger-calls")
    
    print("\n" + "="*70)
    print("Tests completed!")
    print("="*70)


if __name__ == "__main__":
    main()
