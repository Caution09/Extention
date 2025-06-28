#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Character Categorization Fix Script
Fixes character categorization in master data TSV file based on comma presence
"""

import csv
import sys

def fix_character_categorization(input_file, output_file):
    """
    Fix character categorization based on comma presence in prompts
    - キャラクター: Character name only (no commas)
    - キャラクター再現: Character name + additional elements (with commas)
    """
    
    fixes_applied = {
        'char_to_repro': 0,  # キャラクター → キャラクター再現
        'repro_to_char': 0,  # キャラクター再現 → キャラクター  
        'broken_prompts': 0,  # Fixed broken prompts
    }
    
    fixed_entries = []
    
    with open(input_file, 'r', encoding='utf-8') as infile:
        reader = csv.reader(infile, delimiter='\t')
        
        for row in reader:
            if len(row) != 4:
                fixed_entries.append(row)
                continue
                
            major, minor, sub, prompt = row
            
            # Skip non-character entries
            if major not in ['キャラクター', 'キャラクター再現']:
                fixed_entries.append(row)
                continue
            
            # Fix broken Micaiah entry
            if 'a girlmicaiah fire emblem' in prompt:
                prompt = 'micaiah_(fire_emblem)'
                fixes_applied['broken_prompts'] += 1
                print(f"Fixed broken prompt: {sub} -> {prompt}")
            
            # Remove excessive braces from character names
            if prompt.startswith('{{{{') and prompt.endswith('}}}}'):
                # Clean up excessive braces but keep character name format
                clean_prompt = prompt.replace('{{{{', '').replace('}}}}', '')
                if ',' not in clean_prompt:  # Only if it's a simple character name
                    prompt = clean_prompt
                    fixes_applied['broken_prompts'] += 1
                    print(f"Cleaned excessive braces: {sub} -> {prompt}")
            
            # Determine correct category based on comma presence
            has_comma = ',' in prompt
            
            if major == 'キャラクター' and has_comma:
                # Move to キャラクター再現
                major = 'キャラクター再現'
                fixes_applied['char_to_repro'] += 1
                print(f"キャラクター → キャラクター再現: {sub}")
                
            elif major == 'キャラクター再現' and not has_comma:
                # Check if it's a real character name or just a fragment
                if prompt.strip() and not prompt.strip() in ['black skirt', 'black jacket', 'hyper detailed']:
                    major = 'キャラクター'
                    fixes_applied['repro_to_char'] += 1
                    print(f"キャラクター再現 → キャラクター: {sub}")
            
            fixed_entries.append([major, minor, sub, prompt])
    
    # Write fixed data
    with open(output_file, 'w', encoding='utf-8', newline='') as outfile:
        writer = csv.writer(outfile, delimiter='\t')
        writer.writerows(fixed_entries)
    
    return fixes_applied

def main():
    input_file = 'マスターデータ.tsv'
    output_file = 'マスターデータ.tsv'
    
    print("Starting character categorization fix...")
    
    fixes = fix_character_categorization(input_file, output_file)
    
    print("\nFixes Applied:")
    print(f"- キャラクター → キャラクター再現: {fixes['char_to_repro']} entries")
    print(f"- キャラクター再現 → キャラクター: {fixes['repro_to_char']} entries")
    print(f"- Fixed broken prompts: {fixes['broken_prompts']} entries")
    print(f"- Total fixes: {sum(fixes.values())} entries")
    
    print("\nCharacter categorization fix completed!")

if __name__ == '__main__':
    main()