"""
Fixi V1.2 P1 Onboarding Aha-Moment Tests
Tests: P1.2 Achievement Modal, P1.1 Coach Auto-Open, P1.3 Simulator Sheet, P1.4 Trial Paywall
"""
import asyncio
import json
from datetime import date

BASE_URL = "https://fixi-premium-trigger.preview.emergentagent.com"

def get_clean_state(debts=None, hasSeenCoachIntro=False):
    """Returns base localStorage state with optional debts"""
    today = date.today().strftime("%a %b %d %Y")  # matches JS new Date().toDateString()
    return {
        "state": {
            "_hasHydrated": True,
            "onboardingComplete": True,
            "userName": "TestUser",
            "debts": debts or [],
            "payments": [],
            "badges": [],
            "isPremium": False,
            "notificationPermissionAsked": True,
            "lastDailyGreeting": today,
            "streakCount": 1,
            "lastShownLevel": 0,
            "onboardingTotalDebt": 0,
            "onboardingMonthlyPayment": 0,
            "clearedDebts": [],
            "trialStartDate": None,
            "trialExpiredSeen": False,
            "anonymousId": "test-anon-id",
            "userAccount": None,
            "installDate": "2026-01-01",
            "firstPaymentMade": False,
            "triggerState": {
                "trigger1Shown": 0, "trigger1Dismissed": 0, "trigger1LastShown": None,
                "trigger2Shown": 0, "trigger2Dismissed": 0, "trigger2LastShown": None,
                "trigger3Shown": 0, "trigger3Dismissed": 0, "trigger3LastShown": None,
                "trigger4Shown": 0, "trigger4Dismissed": 0, "trigger4LastShown": None,
                "trigger5DismissedUntil": None,
                "trigger6Shown": 0, "trigger6Dismissed": 0, "trigger6LastShown": None,
                "lastTriggerShownInSession": None
            }
        },
        "version": 0
    }

SAMPLE_DEBT = {
    "id": "test-debt-001",
    "name": "Test Ratenkredit",
    "totalAmount": 5000,
    "remainingAmount": 5000,
    "interestRate": 5.0,
    "monthlyPayment": 200,
    "startDate": "2026-01-01T00:00:00.000Z",
    "color": "#00D4AA",
    "icon": "bank",
    "dueDay": 1,
    "debtType": "ratenkredit"
}

async def setup_storage(page, debts=None, coach_intro_seen=False, simulator_seen=False, paywall_seen=False):
    """Setup localStorage and AsyncStorage flags"""
    state = get_clean_state(debts=debts)
    state_json = json.dumps(state)
    
    await page.evaluate(f"""() => {{
        localStorage.clear();
        localStorage.setItem('fixi-storage', JSON.stringify({state_json}));
        {'localStorage.setItem("hasSeenCoachIntro", "true");' if coach_intro_seen else 'localStorage.removeItem("hasSeenCoachIntro");'}
        {'localStorage.setItem("hasSeenSimulatorSheet", "true");' if simulator_seen else 'localStorage.removeItem("hasSeenSimulatorSheet");'}
        {'localStorage.setItem("hasSeenOnboardingPaywall", "true");' if paywall_seen else 'localStorage.removeItem("hasSeenOnboardingPaywall");'}
    }}""")

async def dismiss_fullscreen_moment_if_present(page):
    """Dismiss fullscreen greeting modal if it appears"""
    try:
        dismiss_btn = await page.wait_for_selector('[data-testid="moment-dismiss-btn"], button:has-text("Los geht")', timeout=2000)
        if dismiss_btn:
            await dismiss_btn.click(force=True)
            await page.wait_for_timeout(500)
    except:
        pass  # No fullscreen moment shown

# ============================================================
# TEST 1: P1.2 First Achievement Modal + P1.1 Coach Auto-Open
# ============================================================
print("\n" + "="*60)
print("TEST 1: P1.2 Achievement Modal + P1.1 Coach Auto-Open")
print("="*60)

try:
    await page.set_viewport_size({"width": 390, "height": 844})
    page.on("console", lambda msg: print(f"  CONSOLE [{msg.type}]: {msg.text}") if msg.type in ["error", "warning"] else None)

    # Setup: clean state, no debts, no coach intro seen
    await page.goto(BASE_URL, wait_until="networkidle")
    await setup_storage(page, debts=[], coach_intro_seen=False)
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1000)
    
    # Navigate to add-debt with ratenkredit type
    await page.goto(f"{BASE_URL}/add-debt?type=ratenkredit", wait_until="networkidle")
    await page.wait_for_timeout(1500)
    
    # Fill form
    name_input = await page.wait_for_selector('[data-testid="debt-name-input"]', timeout=5000)
    await name_input.fill("Mein erster Kredit")
    
    total_input = await page.wait_for_selector('[data-testid="debt-total-input"]', timeout=3000)
    await total_input.fill("5000")
    
    monthly_input = await page.wait_for_selector('[data-testid="debt-monthly-input"]', timeout=3000)
    await monthly_input.fill("200")
    
    print("  ✓ Form filled with first debt details")
    
    # Click save
    save_btn = await page.wait_for_selector('[data-testid="save-debt-btn"]', timeout=3000)
    await save_btn.click(force=True)
    
    print("  ✓ Clicked save button")
    await page.wait_for_timeout(800)
    
    # Check for achievement modal
    achievement_visible = False
    achievement_text = ""
    try:
        # Try by testID attribute on Modal
        achievement_modal = await page.wait_for_selector('[data-testid="achievement-modal"]', timeout=3000)
        if achievement_modal:
            achievement_visible = True
            print("  ✓ Achievement modal found via testID")
    except:
        pass
    
    if not achievement_visible:
        # Try by text content
        try:
            await page.wait_for_selector('text=Erster Schritt gemacht!', timeout=3000)
            achievement_visible = True
            print("  ✓ Achievement modal found via text 'Erster Schritt gemacht!'")
        except:
            pass
    
    if achievement_visible:
        # Check the exact text
        try:
            title_el = await page.query_selector('text=Erster Schritt gemacht!')
            if title_el:
                achievement_text = await title_el.text_content()
                print(f"  ✓ Achievement title: '{achievement_text}'")
        except:
            pass
        
        # Take screenshot of achievement modal
        await page.screenshot(path=".screenshots/test1_achievement_modal.jpg", quality=40, full_page=False)
        print("  ✓ Screenshot: test1_achievement_modal.jpg")
    else:
        print("  ✗ FAIL: Achievement modal NOT visible after adding first debt!")

    # Wait for the 3-second timer to complete (modal shows for 3s, then navigates)
    print("  ... Waiting 4s for achievement modal timer + AI Coach navigation...")
    await page.wait_for_timeout(4200)
    
    current_url = page.url
    print(f"  Current URL after wait: {current_url}")
    
    # Check if navigated to AI Coach
    if 'ai-coach' in current_url:
        print("  ✓ Navigated to AI Coach screen")
        if 'introMode=true' in current_url:
            print("  ✓ introMode=true in URL")
        else:
            print("  ⚠ WARNING: 'introMode=true' not in URL. URL:", current_url)
    else:
        print(f"  ✗ FAIL: Expected navigation to ai-coach, but URL is: {current_url}")
    
    await page.wait_for_timeout(1000)
    
    # Check intro message in AI Coach
    intro_message_found = False
    try:
        # Check for personalized months message
        await page.wait_for_selector('text=Ich hab deinen Plan analysiert', timeout=3000)
        intro_message_found = True
        print("  ✓ Intro message found: 'Ich hab deinen Plan analysiert...'")
    except:
        # Try partial text
        page_text = await page.evaluate("() => document.body.innerText")
        if "Monate früher fertig sein" in page_text or "deinen Plan analysiert" in page_text:
            intro_message_found = True
            print("  ✓ Intro message found in page text")
        else:
            print("  ✗ FAIL: Intro message NOT found in AI Coach")
            print(f"  Page text snippet: {page_text[:500]}")
    
    # Check 'Ja, zeig mir!' button
    intro_btn_found = False
    try:
        intro_btn = await page.wait_for_selector('[data-testid="coach-intro-yes-btn"]', timeout=3000)
        if intro_btn:
            intro_btn_text = await intro_btn.text_content()
            intro_btn_found = True
            print(f"  ✓ 'Ja, zeig mir!' button found: '{intro_btn_text}'")
    except:
        # Try by text
        try:
            btn = await page.wait_for_selector('text=Ja, zeig mir!', timeout=2000)
            intro_btn_found = True
            print("  ✓ 'Ja, zeig mir!' button found via text selector")
        except:
            print("  ✗ FAIL: 'Ja, zeig mir!' button NOT found")
    
    await page.screenshot(path=".screenshots/test1_ai_coach_intro.jpg", quality=40, full_page=False)
    print(f"\n  TEST 1 RESULT: Achievement={'PASS' if achievement_visible else 'FAIL'}, CoachNav={'PASS' if 'ai-coach' in current_url else 'FAIL'}, IntroMsg={'PASS' if intro_message_found else 'FAIL'}, IntroBtn={'PASS' if intro_btn_found else 'FAIL'}")

except Exception as e:
    print(f"  ✗ TEST 1 ERROR: {e}")
    import traceback
    traceback.print_exc()

# ============================================================
# TEST 2: P1.1 Second Debt - No Achievement, No Coach Nav
# ============================================================
print("\n" + "="*60)
print("TEST 2: P1.1 Second Debt - No Achievement Modal")
print("="*60)

try:
    # Setup: 1 existing debt, coach intro already seen
    await page.goto(BASE_URL, wait_until="networkidle")
    await setup_storage(page, debts=[SAMPLE_DEBT], coach_intro_seen=True, simulator_seen=True)
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1000)
    
    # Navigate to add debt
    await page.goto(f"{BASE_URL}/add-debt?type=ratenkredit", wait_until="networkidle")
    await page.wait_for_timeout(1500)
    
    # Fill form
    name_input = await page.wait_for_selector('[data-testid="debt-name-input"]', timeout=5000)
    await name_input.fill("Zweiter Kredit")
    
    total_input = await page.wait_for_selector('[data-testid="debt-total-input"]', timeout=3000)
    await total_input.fill("2000")
    
    monthly_input = await page.wait_for_selector('[data-testid="debt-monthly-input"]', timeout=3000)
    await monthly_input.fill("100")
    
    # Click save
    save_btn = await page.wait_for_selector('[data-testid="save-debt-btn"]', timeout=3000)
    await save_btn.click(force=True)
    
    print("  ✓ Clicked save for second debt")
    await page.wait_for_timeout(2000)
    
    # Check no achievement modal
    achievement_shown = False
    try:
        el = await page.wait_for_selector('text=Erster Schritt gemacht!', timeout=1500)
        if el:
            achievement_shown = True
    except:
        pass
    
    current_url_2 = page.url
    navigated_to_coach = 'ai-coach' in current_url_2
    
    if not achievement_shown:
        print("  ✓ PASS: No achievement modal shown for second debt")
    else:
        print("  ✗ FAIL: Achievement modal shown for second debt (should not appear!)")
    
    if not navigated_to_coach:
        print(f"  ✓ PASS: Did NOT navigate to AI Coach. Current URL: {current_url_2}")
    else:
        print(f"  ✗ FAIL: Navigated to AI Coach for second debt! URL: {current_url_2}")
    
    print(f"\n  TEST 2 RESULT: NoAchievement={'PASS' if not achievement_shown else 'FAIL'}, NoCoachNav={'PASS' if not navigated_to_coach else 'FAIL'}")

except Exception as e:
    print(f"  ✗ TEST 2 ERROR: {e}")

# ============================================================
# TEST 3: P1.3 Simulator Bottom Sheet
# ============================================================
print("\n" + "="*60)
print("TEST 3: P1.3 Simulator Bottom Sheet (5s timer)")
print("="*60)

try:
    # Setup: 1 debt, no simulator seen
    await page.goto(BASE_URL, wait_until="networkidle")
    await setup_storage(page, debts=[SAMPLE_DEBT], coach_intro_seen=True, simulator_seen=False, paywall_seen=True)
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1500)
    
    # Dismiss any fullscreen moment
    await dismiss_fullscreen_moment_if_present(page)
    
    print("  ... Waiting 6s for Simulator Bottom Sheet (5s timer)...")
    await page.wait_for_timeout(6000)
    
    # Check simulator bottom sheet
    simulator_sheet_visible = False
    try:
        sheet = await page.wait_for_selector('[data-testid="simulator-bottom-sheet"]', timeout=3000)
        if sheet:
            simulator_sheet_visible = True
            print("  ✓ Simulator bottom sheet found via testID")
    except:
        pass
    
    if not simulator_sheet_visible:
        # Try by content
        try:
            await page.wait_for_selector('text=Was wäre wenn du nur 50€ mehr im Monat zahlst?', timeout=2000)
            simulator_sheet_visible = True
            print("  ✓ Simulator bottom sheet found via text content")
        except:
            page_text = await page.evaluate("() => document.body.innerText")
            if "50€ mehr" in page_text or "Simulator öffnen" in page_text:
                simulator_sheet_visible = True
                print("  ✓ Simulator bottom sheet detected in page text")
            else:
                print("  ✗ FAIL: Simulator Bottom Sheet NOT visible after 6s!")
                print(f"  Page text snippet: {page_text[:400]}")
    
    # Check calculations visible
    calc_visible = False
    if simulator_sheet_visible:
        try:
            # Check for "Aktuell fertig in" or "Mit +50€/Monat" text
            page_text = await page.evaluate("() => document.body.innerText")
            if "Aktuell fertig in" in page_text or "+50€" in page_text or "Monate" in page_text:
                calc_visible = True
                print("  ✓ Calculation rows visible in sheet")
            else:
                print("  ⚠ Calculation rows NOT found in sheet text")
                print(f"  Page text snippet: {page_text[:600]}")
        except Exception as e:
            print(f"  ⚠ Could not check calculations: {e}")
    
    # Check 'Simulator öffnen' button
    open_sim_btn_found = False
    try:
        open_btn = await page.wait_for_selector('[data-testid="open-simulator-btn"]', timeout=2000)
        if open_btn:
            open_sim_btn_found = True
            btn_text = await open_btn.text_content()
            print(f"  ✓ 'Simulator öffnen' button found: '{btn_text}'")
    except:
        try:
            btn = await page.wait_for_selector('text=Simulator öffnen', timeout=2000)
            open_sim_btn_found = True
            print("  ✓ 'Simulator öffnen' button found via text selector")
        except:
            print("  ✗ FAIL: 'Simulator öffnen' button NOT found")
    
    await page.screenshot(path=".screenshots/test3_simulator_sheet.jpg", quality=40, full_page=False)
    
    # Test navigation to simulator
    if open_sim_btn_found:
        try:
            open_btn = await page.wait_for_selector('[data-testid="open-simulator-btn"]', timeout=2000)
            await open_btn.click(force=True)
            await page.wait_for_timeout(2000)
            
            sim_url = page.url
            if 'simulator' in sim_url:
                print(f"  ✓ 'Simulator öffnen' navigates to simulator: {sim_url}")
            else:
                print(f"  ✗ FAIL: Did not navigate to simulator. URL: {sim_url}")
        except Exception as e:
            print(f"  ⚠ Could not test simulator navigation: {e}")
    
    print(f"\n  TEST 3 RESULT: Sheet={'PASS' if simulator_sheet_visible else 'FAIL'}, Calcs={'PASS' if calc_visible else 'FAIL'}, OpenBtn={'PASS' if open_sim_btn_found else 'FAIL'}")

except Exception as e:
    print(f"  ✗ TEST 3 ERROR: {e}")
    import traceback
    traceback.print_exc()

# ============================================================
# TEST 4: P1.4 Onboarding Trial Paywall
# ============================================================
print("\n" + "="*60)
print("TEST 4: P1.4 Onboarding Trial Paywall")
print("="*60)

try:
    # Setup: 1 debt, no simulator seen, no paywall seen, not premium
    await page.goto(BASE_URL, wait_until="networkidle")
    await setup_storage(page, debts=[SAMPLE_DEBT], coach_intro_seen=True, simulator_seen=False, paywall_seen=False)
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1500)
    
    # Dismiss any fullscreen moment
    await dismiss_fullscreen_moment_if_present(page)
    
    print("  ... Waiting 6s for Simulator Bottom Sheet to appear...")
    await page.wait_for_timeout(6000)
    
    # Check simulator sheet appeared
    sim_sheet_appeared = False
    try:
        await page.wait_for_selector('text=Simulator öffnen', timeout=3000)
        sim_sheet_appeared = True
        print("  ✓ Simulator sheet appeared")
    except:
        try:
            await page.wait_for_selector('[data-testid="simulator-sheet-dismiss"]', timeout=2000)
            sim_sheet_appeared = True
            print("  ✓ Simulator sheet appeared (via dismiss btn)")
        except:
            print("  ⚠ Simulator sheet not found - proceeding anyway")
    
    # Click 'Vielleicht später' to dismiss the simulator sheet
    dismissed_sheet = False
    try:
        dismiss_btn = await page.wait_for_selector('[data-testid="simulator-sheet-dismiss"]', timeout=3000)
        await dismiss_btn.click(force=True)
        dismissed_sheet = True
        print("  ✓ Clicked 'Vielleicht später' to dismiss simulator sheet")
    except:
        # Try by text
        try:
            btn = await page.wait_for_selector('text=Vielleicht später', timeout=2000)
            await btn.click(force=True)
            dismissed_sheet = True
            print("  ✓ Dismissed simulator sheet via text selector")
        except Exception as e:
            print(f"  ⚠ Could not find/click dismiss button: {e}")
    
    await page.wait_for_timeout(1500)
    
    # Check onboarding paywall appears
    paywall_visible = False
    try:
        paywall = await page.wait_for_selector('[data-testid="onboarding-paywall"]', timeout=4000)
        if paywall:
            paywall_visible = True
            print("  ✓ Onboarding paywall found via testID")
    except:
        pass
    
    if not paywall_visible:
        try:
            await page.wait_for_selector('text=7 Tage kostenlos testen', timeout=3000)
            paywall_visible = True
            print("  ✓ Onboarding paywall found via '7 Tage kostenlos testen' text")
        except:
            page_text = await page.evaluate("() => document.body.innerText")
            if "7 Tage kostenlos" in page_text or "Hol das Maximum" in page_text:
                paywall_visible = True
                print("  ✓ Onboarding paywall detected in page text")
            else:
                print("  ✗ FAIL: Onboarding paywall NOT visible after dismissing simulator sheet!")
                print(f"  Page text snippet: {page_text[:500]}")
    
    await page.screenshot(path=".screenshots/test4_onboarding_paywall.jpg", quality=40, full_page=False)
    
    # Check '7 Tage kostenlos testen' button
    trial_btn_found = False
    if paywall_visible:
        try:
            trial_btn = await page.wait_for_selector('[data-testid="onboarding-paywall-trial-btn"]', timeout=2000)
            if trial_btn:
                trial_btn_found = True
                trial_btn_text = await trial_btn.text_content()
                print(f"  ✓ Trial button found: '{trial_btn_text}'")
        except:
            try:
                btn = await page.wait_for_selector('text=7 Tage kostenlos testen', timeout=2000)
                trial_btn_found = True
                print("  ✓ Trial button found via text selector")
            except:
                print("  ✗ FAIL: '7 Tage kostenlos testen' button NOT found")
    
    # Check 'Später' button
    later_btn_found = False
    if paywall_visible:
        try:
            later_btn = await page.wait_for_selector('[data-testid="onboarding-paywall-dismiss"]', timeout=2000)
            if later_btn:
                later_btn_found = True
                print("  ✓ 'Später' button found via testID")
        except:
            try:
                btn = await page.wait_for_selector('text=Später', timeout=2000)
                later_btn_found = True
                print("  ✓ 'Später' button found via text selector")
            except:
                print("  ✗ FAIL: 'Später' button NOT found")
    
    # Click '7 Tage kostenlos testen' and check navigation
    trial_navigates = False
    if trial_btn_found:
        try:
            trial_btn = await page.wait_for_selector('[data-testid="onboarding-paywall-trial-btn"]', timeout=2000)
            await trial_btn.click(force=True)
            await page.wait_for_timeout(2000)
            
            paywall_url = page.url
            if 'paywall' in paywall_url:
                trial_navigates = True
                print(f"  ✓ '7 Tage kostenlos testen' navigates to paywall: {paywall_url}")
            else:
                print(f"  ✗ FAIL: Did not navigate to /paywall. URL: {paywall_url}")
        except Exception as e:
            print(f"  ⚠ Could not test trial navigation: {e}")
    
    # Re-setup and test 'Später' button (dismiss)
    print("  ... Re-testing 'Später' button dismiss flow...")
    await page.goto(BASE_URL, wait_until="networkidle")
    await setup_storage(page, debts=[SAMPLE_DEBT], coach_intro_seen=True, simulator_seen=False, paywall_seen=False)
    await page.reload(wait_until="networkidle")
    await page.wait_for_timeout(1500)
    await dismiss_fullscreen_moment_if_present(page)
    await page.wait_for_timeout(6000)
    
    # Dismiss simulator sheet
    try:
        dismiss_btn = await page.wait_for_selector('[data-testid="simulator-sheet-dismiss"]', timeout=3000)
        await dismiss_btn.click(force=True)
        await page.wait_for_timeout(1500)
    except:
        pass
    
    # Click 'Später' to dismiss paywall
    paywall_dismissed = False
    try:
        later_btn = await page.wait_for_selector('[data-testid="onboarding-paywall-dismiss"]', timeout=3000)
        if later_btn:
            await later_btn.click(force=True)
            await page.wait_for_timeout(1000)
            
            # Check paywall no longer visible
            paywall_still_visible = False
            try:
                el = await page.wait_for_selector('text=7 Tage kostenlos testen', timeout=1500)
                paywall_still_visible = bool(el)
            except:
                paywall_still_visible = False
            
            if not paywall_still_visible:
                paywall_dismissed = True
                print("  ✓ 'Später' button successfully dismisses paywall")
            else:
                print("  ✗ FAIL: Paywall still visible after clicking 'Später'")
    except Exception as e:
        print(f"  ⚠ Could not test 'Später' dismiss: {e}")
    
    print(f"\n  TEST 4 RESULT: Paywall={'PASS' if paywall_visible else 'FAIL'}, TrialBtn={'PASS' if trial_btn_found else 'FAIL'}, TrialNav={'PASS' if trial_navigates else 'FAIL'}, LaterBtn={'PASS' if later_btn_found else 'FAIL'}, Dismiss={'PASS' if paywall_dismissed else 'FAIL'}")

except Exception as e:
    print(f"  ✗ TEST 4 ERROR: {e}")
    import traceback
    traceback.print_exc()

# ============================================================
# TEST 5: AsyncStorage Flags verification
# ============================================================
print("\n" + "="*60)
print("TEST 5: AsyncStorage Flags verification")
print("="*60)

try:
    # Check all flags after the previous tests
    flags = await page.evaluate("""() => ({
        hasSeenCoachIntro: localStorage.getItem('hasSeenCoachIntro'),
        hasSeenSimulatorSheet: localStorage.getItem('hasSeenSimulatorSheet'),
        hasSeenOnboardingPaywall: localStorage.getItem('hasSeenOnboardingPaywall')
    })""")
    
    print(f"  hasSeenCoachIntro: {flags.get('hasSeenCoachIntro')}")
    print(f"  hasSeenSimulatorSheet: {flags.get('hasSeenSimulatorSheet')}")
    print(f"  hasSeenOnboardingPaywall: {flags.get('hasSeenOnboardingPaywall')}")
    
    coach_flag = flags.get('hasSeenCoachIntro') == 'true'
    sim_flag = flags.get('hasSeenSimulatorSheet') == 'true'
    paywall_flag = flags.get('hasSeenOnboardingPaywall') == 'true'
    
    print(f"\n  TEST 5 RESULT: CoachFlag={'PASS' if coach_flag else 'FAIL'}, SimFlag={'PASS' if sim_flag else 'FAIL'}, PaywallFlag={'PASS' if paywall_flag else 'FAIL'}")

except Exception as e:
    print(f"  ✗ TEST 5 ERROR: {e}")

print("\n" + "="*60)
print("ALL TESTS COMPLETE")
print("="*60)
