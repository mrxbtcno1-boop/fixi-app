#!/usr/bin/env python3
"""Apply theme overrides to all Fixi screens."""
import re
import os

# All screen files that need theming
SCREENS = {
    # Tabs
    '/app/frontend/app/(tabs)/index.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/(tabs)/debts.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/(tabs)/stats.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/(tabs)/achievements.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/(tabs)/profile.tsx': '../../src/contexts/ThemeContext',
    # Screens
    '/app/frontend/app/settings.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/ai-coach.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/paywall.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/record-payment.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/add-debt.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/simulator.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/evening-reflection.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/weekly-digest.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/privacy-policy.tsx': '../src/contexts/ThemeContext',
    '/app/frontend/app/terms.tsx': '../src/contexts/ThemeContext',
    # Onboarding
    '/app/frontend/app/onboarding/index.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/onboarding/step2.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/onboarding/step3.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/onboarding/step4.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/onboarding/step5.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/onboarding/step6.tsx': '../../src/contexts/ThemeContext',
    '/app/frontend/app/onboarding/step7.tsx': '../../src/contexts/ThemeContext',
}

def process_file(filepath, import_path):
    if not os.path.exists(filepath):
        print(f"SKIP: {filepath} (not found)")
        return
    
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Step 1: Add useThemeOverrides import if not present
    if 'useThemeOverrides' not in content:
        if 'useTheme' in content:
            # Already has useTheme import, add useThemeOverrides
            content = content.replace(
                f"import {{ useTheme }} from '{import_path}';",
                f"import {{ useTheme, useThemeOverrides }} from '{import_path}';"
            )
        else:
            # Add new import after last import
            lines = content.split('\n')
            last_import_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    last_import_idx = i
            lines.insert(last_import_idx + 1, f"import {{ useThemeOverrides }} from '{import_path}';")
            content = '\n'.join(lines)
    
    # Step 2: Add `const t = useThemeOverrides();` after the first line containing `useAppStore`
    # or after function declaration if no useAppStore
    if 'const t = useThemeOverrides()' not in content:
        # Find the function body - look for patterns like `const router = useRouter();` or `const debts = useAppStore`
        # Insert after the first hook call
        patterns = [
            r'(const \w+ = useAppStore\(s => s\.\w+\);)',
            r'(const router = useRouter\(\);)',
            r'(const \{ mode, setMode \} = useTheme\(\);)',
        ]
        inserted = False
        for pattern in patterns:
            match = re.search(pattern, content)
            if match:
                insert_pos = match.end()
                content = content[:insert_pos] + '\n  const t = useThemeOverrides();' + content[insert_pos:]
                inserted = True
                break
        
        if not inserted:
            # Fallback: insert after function declaration
            func_match = re.search(r'(export default function \w+\(\)[^{]*\{)', content)
            if func_match:
                insert_pos = func_match.end()
                content = content[:insert_pos] + '\n  const t = useThemeOverrides();' + content[insert_pos:]
    
    # Step 3: Override SafeAreaView backgrounds
    # Pattern: style={styles.safe}  -> style={[styles.safe, t.bg]}
    content = re.sub(
        r'style=\{styles\.safe\}',
        r'style={[styles.safe, t.bg]}',
        content
    )
    
    # Step 4: Override card backgrounds
    # Pattern: style={styles.card}  -> style={[styles.card, t.bgCard]}
    content = re.sub(
        r'style=\{styles\.card\}',
        r'style={[styles.card, t.bgCard]}',
        content
    )
    
    # Step 5: Override card-like containers (summaryCard, progressCard, etc.)
    for card_name in ['summaryCard', 'progressCard', 'countdownCard', 'streakCard', 
                       'chartCard', 'overviewCard', 'savingsCard', 'activityCard',
                       'levelCard', 'digestCta', 'reflectionCta', 'debtCard',
                       'emptyCard', 'inputRow', 'extraToggle', 'selectedDebtBadge',
                       'quickCard', 'limitReachedBox']:
        content = re.sub(
            rf'style=\{{styles\.{card_name}\}}',
            rf'style={{[styles.{card_name}, t.bgCard]}}',
            content
        )
    
    # Step 6: Override main title text
    for text_name in ['title', 'headerTitle', 'sectionTitle', 'greeting', 
                       'debtName', 'settingLabel', 'linkLabel', 'methodLabel',
                       'chartTitle', 'emptyTitle', 'doneTitle']:
        content = re.sub(
            rf'style=\{{styles\.{text_name}\}}',
            rf'style={{[styles.{text_name}, t.textPrimary]}}',
            content
        )

    # Step 7: Override secondary text
    for text_name in ['quote', 'debtMeta', 'settingValue', 'methodDesc', 
                       'debtRemaining', 'emptyText', 'doneSubtitle', 'priceInfo',
                       'headerSub', 'barLabel', 'noData', 'premiumHint',
                       'countdownDate', 'streakHint', 'methodHint']:
        content = re.sub(
            rf'style=\{{styles\.{text_name}\}}',
            rf'style={{[styles.{text_name}, t.textSecondary]}}',
            content
        )
    
    with open(filepath, 'w') as f:
        f.write(content)
    
    print(f"OK: {filepath}")

for filepath, import_path in SCREENS.items():
    process_file(filepath, import_path)

print("\nDone! All screens themed.")
