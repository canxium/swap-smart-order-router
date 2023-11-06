"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenPropertiesProvider = exports.DEFAULT_TOKEN_PROPERTIES_RESULT = void 0;
const util_1 = require("../util");
const token_fee_fetcher_1 = require("./token-fee-fetcher");
const token_validator_provider_1 = require("./token-validator-provider");
exports.DEFAULT_TOKEN_PROPERTIES_RESULT = {
    tokenFeeResult: token_fee_fetcher_1.DEFAULT_TOKEN_FEE_RESULT,
};
class TokenPropertiesProvider {
    constructor(chainId, tokenValidatorProvider, tokenPropertiesCache, tokenFeeFetcher, allowList = token_validator_provider_1.DEFAULT_ALLOWLIST) {
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
                    tokenValidationResult: token_validator_provider_1.TokenValidationResult.UNKN,
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
                token_validator_provider_1.TokenValidationResult.FOT) {
                addressesToFetchFeesOnchain.push(address);
            }
        }
        if (addressesToFetchFeesOnchain.length > 0) {
            let tokenFeeMap = {};
            try {
                tokenFeeMap = await this.tokenFeeFetcher.fetchFees(addressesToFetchFeesOnchain, providerConfig);
            }
            catch (err) {
                util_1.log.error({ err }, `Error fetching fees for tokens ${addressesToFetchFeesOnchain}`);
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
                        tokenValidationResult: token_validator_provider_1.TokenValidationResult.FOT,
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
exports.TokenPropertiesProvider = TokenPropertiesProvider;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW4tcHJvcGVydGllcy1wcm92aWRlci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9wcm92aWRlcnMvdG9rZW4tcHJvcGVydGllcy1wcm92aWRlci50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFFQSxrQ0FBOEI7QUFHOUIsMkRBSzZCO0FBQzdCLHlFQUlvQztBQUV2QixRQUFBLCtCQUErQixHQUEwQjtJQUNwRSxjQUFjLEVBQUUsNENBQXdCO0NBQ3pDLENBQUM7QUFnQkYsTUFBYSx1QkFBdUI7SUFJbEMsWUFDVSxPQUFnQixFQUNoQixzQkFBK0MsRUFDL0Msb0JBQW1ELEVBQ25ELGVBQWlDLEVBQ2pDLFlBQVksNENBQWlCO1FBSjdCLFlBQU8sR0FBUCxPQUFPLENBQVM7UUFDaEIsMkJBQXNCLEdBQXRCLHNCQUFzQixDQUF5QjtRQUMvQyx5QkFBb0IsR0FBcEIsb0JBQW9CLENBQStCO1FBQ25ELG9CQUFlLEdBQWYsZUFBZSxDQUFrQjtRQUNqQyxjQUFTLEdBQVQsU0FBUyxDQUFvQjtRQVIvQixjQUFTLEdBQUcsQ0FBQyxPQUFnQixFQUFFLE9BQWUsRUFBRSxFQUFFLENBQ3hELG9CQUFvQixPQUFPLElBQUksT0FBTyxFQUFFLENBQUM7SUFReEMsQ0FBQztJQUVHLEtBQUssQ0FBQyxtQkFBbUIsQ0FDOUIsTUFBZSxFQUNmLGNBQStCOztRQUUvQixNQUFNLGtCQUFrQixHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQ3RDLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FDNUQsQ0FBQztRQUNGLE1BQU0sc0JBQXNCLEdBQzFCLE1BQU0sSUFBSSxDQUFDLHNCQUFzQixDQUFDLGNBQWMsQ0FDOUMsa0JBQWtCLEVBQ2xCLGNBQWMsQ0FDZixDQUFDO1FBQ0osTUFBTSxhQUFhLEdBQXVCLEVBQUUsQ0FB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