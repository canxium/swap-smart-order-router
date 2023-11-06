import { log } from '../util';
import { DEFAULT_TOKEN_FEE_RESULT, } from './token-fee-fetcher';
import { DEFAULT_ALLOWLIST, TokenValidationResult, } from './token-validator-provider';
export const DEFAULT_TOKEN_PROPERTIES_RESULT = {
    tokenFeeResult: DEFAULT_TOKEN_FEE_RESULT,
};
export class TokenPropertiesProvider {
    constructor(chainId, tokenValidatorProvider, tokenPropertiesCache, tokenFeeFetcher, allowList = DEFAULT_ALLOWLIST) {
        this.chainId = chainId;
        this.tokenValidatorProvider = tokenValidatorProvider;
        this.tokenPropertiesCache = tokenPropertiesCache;
        this.tokenFeeFetcher = tokenFeeFetcher;
        this.allowList = allowList;
        this.CACHE_KEY = (chainId, address) => `token-properties-${chainId}-${address}`;
    }
    async getTokensProperties(tokens, providerConfig) {
        var _a;
        const nonAllowlistTokens = tokens.filter((token) => !this.allowList.has(token.address.toLowerCase()));
        const tokenValidationResults = await this.tokenValidatorProvider.validateTokens(nonAllowlistTokens, providerConfig);
        const tokenToResult = {};
        tokens.forEach((token) => {
            if (this.allowList.has(token.address.toLowerCase())) {
                // if the token is in the allowlist, make it UNKNOWN so that we don't fetch the FOT fee on-chain
                tokenToResult[token.address.toLowerCase()] = {
                    tokenValidationResult: TokenValidationResult.UNKN,
                };
            }
            else {
                tokenToResult[token.address.toLowerCase()] = {
                    tokenValidationResult: tokenValidationResults.getValidationByToken(token),
                };
            }
        });
        const addressesToFetchFeesOnchain = [];
        const addressesRaw = this.buildAddressesRaw(tokens);
        const tokenProperties = await this.tokenPropertiesCache.batchGet(addressesRaw);
        // Check if we have cached token validation results for any tokens.
        for (const address of addressesRaw) {
            const cachedValue = tokenProperties[address];
            if (cachedValue) {
                tokenToResult[address] = cachedValue;
            }
            else if (((_a = tokenToResult[address]) === null || _a === void 0 ? void 0 : _a.tokenValidationResult) ===
                TokenValidationResult.FOT) {
                addressesToFetchFeesOnchain.push(address);
            }
        }
        if (addressesToFetchFeesOnchain.length > 0) {
            let tokenFeeMap = {};
            try {
                tokenFeeMap = await this.tokenFeeFetcher.fetchFees(addressesToFetchFeesOnchain, providerConfig);
            }
            catch (err) {
                log.error({ err }, `Error fetching fees for tokens ${addressesToFetchFeesOnchain}`);
            }
            await Promise.all(addressesToFetchFeesOnchain.map((address) => {
                const tokenFee = tokenFeeMap[address];
                if (tokenFee && (tokenFee.buyFeeBps || tokenFee.sellFeeBps)) {
                    const tokenResultForAddress = tokenToResult[address];
                    if (tokenResultForAddress) {
                        tokenResultForAddress.tokenFeeResult = tokenFee;
                    }
                    // update cache concurrently
                    // at this point, we are confident that the tokens are FOT, so we can hardcode the validation result
                    return this.tokenPropertiesCache.set(this.CACHE_KEY(this.chainId, address), {
                        tokenFeeResult: tokenFee,
                        tokenValidationResult: TokenValidationResult.FOT,
                    });
                }
                else {
                    return Promise.resolve(true);
                }
            }));
        }
        return tokenToResult;
    }
    buildAddressesRaw(tokens) {
        const addressesRaw = new Set();
        for (const token of tokens) {
            const address = token.address.toLowerCase();
            if (!addressesRaw.has(address)) {
                addressesRaw.add(address);
            }
        }
        return addressesRaw;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW4tcHJvcGVydGllcy1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm92aWRlcnMvdG9rZW4tcHJvcGVydGllcy1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxPQUFPLEVBQUUsR0FBRyxFQUFFLE1BQU0sU0FBUyxDQUFDO0FBRzlCLE9BQU8sRUFDTCx3QkFBd0IsR0FJekIsTUFBTSxxQkFBcUIsQ0FBQztBQUM3QixPQUFPLEVBQ0wsaUJBQWlCLEVBRWpCLHFCQUFxQixHQUN0QixNQUFNLDRCQUE0QixDQUFDO0FBRXBDLE1BQU0sQ0FBQyxNQUFNLCtCQUErQixHQUEwQjtJQUNwRSxjQUFjLEVBQUUsd0JBQXdCO0NBQ3pDLENBQUM7QUFnQkYsTUFBTSxPQUFPLHVCQUF1QjtJQUlsQyxZQUNVLE9BQWdCLEVBQ2hCLHNCQUErQyxFQUMvQyxvQkFBbUQsRUFDbkQsZUFBaUMsRUFDakMsWUFBWSxpQkFBaUI7UUFKN0IsWUFBTyxHQUFQLE9BQU8sQ0FBUztRQUNoQiwyQkFBc0IsR0FBdEIsc0JBQXNCLENBQXlCO1FBQy9DLHlCQUFvQixHQUFwQixvQkFBb0IsQ0FBK0I7UUFDbkQsb0JBQWUsR0FBZixlQUFlLENBQWtCO1FBQ2pDLGNBQVMsR0FBVCxTQUFTLENBQW9CO1FBUi9CLGNBQVMsR0FBRyxDQUFDLE9BQWdCLEVBQUUsT0FBZSxFQUFFLEVBQUUsQ0FDeEQsb0JBQW9CLE9BQU8sSUFBSSxPQUFPLEVBQUUsQ0FBQztJQVF4QyxDQUFDO0lBRUcsS0FBSyxDQUFDLG1CQUFtQixDQUM5QixNQUFlLEVBQ2YsY0FBK0I7O1FBRS9CLE1BQU0sa0JBQWtCLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FDdEMsQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUM1RCxDQUFD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