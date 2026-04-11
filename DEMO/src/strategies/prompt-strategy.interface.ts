import { PromptContract } from '../types/promt-contract';

// IPromptStrategy defines the contract all strategy classes must implement.
// Each tier (Investigator, Qualifier, Calculator) has its own strategy class
// that knows how to assemble its PromptContract from the relevant prompt files.

export interface IPromptStrategy {
  build(): PromptContract;
}
