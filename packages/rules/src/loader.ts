import yaml from 'js-yaml';
import { promises as fs } from 'fs';
import path from 'path';
import { RulePack, RulePackSchema } from './types';

const RULEPACKS_DIR = path.join(__dirname, '../rulepacks');

export async function loadRulePacks(): Promise<RulePack[]> {
  const rulePacks: RulePack[] = [];
  
  try {
    const files = await fs.readdir(RULEPACKS_DIR);
    const yamlFiles = files.filter(file => file.endsWith('.yaml'));
    
    for (const file of yamlFiles) {
      const filePath = path.join(RULEPACKS_DIR, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const rulePack = yaml.load(content) as any;
      
      // Validate the rule pack
      const validated = RulePackSchema.parse(rulePack);
      rulePacks.push(validated);
    }
  } catch (error) {
    console.error('Failed to load rule packs:', error);
  }
  
  return rulePacks;
}

export async function loadRulesByCategory(category: string): Promise<RulePack[]> {
  const allPacks = await loadRulePacks();
  return allPacks.filter(pack => 
    pack.rules.some(rule => rule.category === category)
  );
}
