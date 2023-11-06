import { BigNumber } from '@ethersproject/bignumber';
import { ChainId } from '@uniswap/sdk-core';
import { TokenFeeDetector__factory } from '../types/other/factories/TokenFeeDetector__factory';
import { log, WRAPPED_NATIVE_CURRENCY } from '../util';
const DEFAULT_TOKEN_BUY_FEE_BPS = BigNumber.from(0);
const DEFAULT_TOKEN_SELL_FEE_BPS = BigNumber.from(0);
// on detector failure, assume no fee
export const DEFAULT_TOKEN_FEE_RESULT = {
    buyFeeBps: DEFAULT_TOKEN_BUY_FEE_BPS,
    sellFeeBps: DEFAULT_TOKEN_SELL_FEE_BPS,
};
// address at which the FeeDetector lens is deployed
const FEE_DETECTOR_ADDRESS = (chainId) => {
    switch (chainId) {
        case ChainId.MAINNET:
        default:
            return '0x19C97dc2a25845C7f9d1d519c8C2d4809c58b43f';
    }
};
// Amount has to be big enough to avoid rounding errors, but small enough that
// most v2 pools will have at least this many token units
// 10000 is the smallest number that avoids rounding errors in bps terms
const AMOUNT_TO_FLASH_BORROW = '10000';
// 1M gas limit per validate call, should cover most swap cases
const GAS_LIMIT_PER_VALIDATE = 1000000;
export class OnChainTokenFeeFetcher {
    constructor(chainId, rpcProvider, tokenFeeAddress = FEE_DETECTOR_ADDRESS(chainId), gasLimitPerCall = GAS_LIMIT_PER_VALIDATE, amountToFlashBorrow = AMOUNT_TO_FLASH_BORROW) {
        var _a;
        this.chainId = chainId;
        this.tokenFeeAddress = tokenFeeAddress;
        this.gasLimitPerCall = gasLimitPerCall;
        this.amountToFlashBorrow = amountToFlashBorrow;
        this.BASE_TOKEN = (_a = WRAPPED_NATIVE_CURRENCY[this.chainId]) === null || _a === void 0 ? void 0 : _a.address;
        this.contract = TokenFeeDetector__factory.connect(this.tokenFeeAddress, rpcProvider);
    }
    async fetchFees(addresses, providerConfig) {
        const tokenToResult = {};
        const functionParams = addresses.map((address) => [
            address,
            this.BASE_TOKEN,
            this.amountToFlashBorrow,
        ]);
        const results = await Promise.all(functionParams.map(async ([address, baseToken, amountToBorrow]) => {
            try {
                // We use the validate function instead of batchValidate to avoid poison pill problem.
                // One token that consumes too much gas could cause the entire batch to fail.
                const feeResult = await this.contract.callStatic.validate(address, baseToken, amountToBorrow, {
                    gasLimit: this.gasLimitPerCall,
                    blockTag: providerConfig === null || providerConfig === void 0 ? void 0 : providerConfig.blockNumber,
                });
                return { address, ...feeResult };
            }
            catch (err) {
                log.error({ err }, `Error calling validate on-chain for token ${address}`);
                // in case of FOT token fee fetch failure, we return null
                // so that they won't get returned from the token-fee-fetcher
                // and thus no fee will be applied, and the cache won't cache on FOT tokens with failed fee fetching
                return { address, buyFeeBps: undefined, sellFeeBps: undefined };
            }
        }));
        results.forEach(({ address, buyFeeBps, sellFeeBps }) => {
            if (buyFeeBps || sellFeeBps) {
                tokenToResult[address] = { buyFeeBps, sellFeeBps };
            }
        });
        return tokenToResult;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidG9rZW4tZmVlLWZldGNoZXIuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvcHJvdmlkZXJzL3Rva2VuLWZlZS1mZXRjaGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSwwQkFBMEIsQ0FBQztBQUVyRCxPQUFPLEVBQUUsT0FBTyxFQUFFLE1BQU0sbUJBQW1CLENBQUM7QUFFNUMsT0FBTyxFQUFFLHlCQUF5QixFQUFFLE1BQU0sb0RBQW9ELENBQUM7QUFFL0YsT0FBTyxFQUFFLEdBQUcsRUFBRSx1QkFBdUIsRUFBRSxNQUFNLFNBQVMsQ0FBQztBQUl2RCxNQUFNLHlCQUF5QixHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEQsTUFBTSwwQkFBMEIsR0FBRyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBRXJELHFDQUFxQztBQUNyQyxNQUFNLENBQUMsTUFBTSx3QkFBd0IsR0FBRztJQUN0QyxTQUFTLEVBQUUseUJBQXlCO0lBQ3BDLFVBQVUsRUFBRSwwQkFBMEI7Q0FDdkMsQ0FBQztBQVVGLG9EQUFvRDtBQUNwRCxNQUFNLG9CQUFvQixHQUFHLENBQUMsT0FBZ0IsRUFBRSxFQUFFO0lBQ2hELFFBQVEsT0FBTyxFQUFFO1FBQ2YsS0FBSyxPQUFPLENBQUMsT0FBTyxDQUFDO1FBQ3JCO1lBQ0UsT0FBTyw0Q0FBNEMsQ0FBQztLQUN2RDtBQUNILENBQUMsQ0FBQztBQUVGLDhFQUE4RTtBQUM5RSx5REFBeUQ7QUFDekQsd0VBQXdFO0FBQ3hFLE1BQU0sc0JBQXNCLEdBQUcsT0FBTyxDQUFDO0FBQ3ZDLCtEQUErRDtBQUMvRCxNQUFNLHNCQUFzQixHQUFHLE9BQVMsQ0FBQztBQVN6QyxNQUFNLE9BQU8sc0JBQXNCO0lBSWpDLFlBQ1UsT0FBZ0IsRUFDeEIsV0FBeUIsRUFDakIsa0JBQWtCLG9CQUFvQixDQUFDLE9BQU8sQ0FBQyxFQUMvQyxrQkFBa0Isc0JBQXNCLEVBQ3hDLHNCQUFzQixzQkFBc0I7O1FBSjVDLFlBQU8sR0FBUCxPQUFPLENBQVM7UUFFaEIsb0JBQWUsR0FBZixlQUFlLENBQWdDO1FBQy9DLG9CQUFlLEdBQWYsZUFBZSxDQUF5QjtRQUN4Qyx3QkFBbUIsR0FBbkIsbUJBQW1CLENBQXlCO1FBRXBELElBQUksQ0FBQyxVQUFVLEdBQUcsTUFBQSx1QkFBdUIsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLDBDQUFFLE9BQU8sQ0FBQztRQUNqRSxJQUFJLENBQUMsUUFBUSxHQUFHLHlCQUF5QixDQUFDLE9BQU8sQ0FDL0MsSUFBSSxDQUFDLGVBQWUsRUFDcEIsV0FBVyxDQUNaLENBQUM7SUFDSixDQUFDO0lBRU0sS0FBSyxDQUFDLFNBQVMsQ0FDcEIsU0FBb0IsRUFDcEIsY0FBK0I7UUFFL0IsTUFBTSxhQUFhLEdBQWdCLEVBQUUsQ0FBQztRQUV0QyxNQUFNLGNBQWMsR0FBRyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQztZQUNoRCxPQUFPO1lBQ1AsSUFBSSxDQUFDLFVBQVU7WUFDZixJQUFJLENBQUMsbUJBQW1CO1NBQ3pCLENBQStCLENBQUM7UUFFakMsTUFBTSxPQUFPLEdBQUcsTUFBTSxPQUFPLENBQUMsR0FBRyxDQUMvQixjQUFjLENBQUMsR0FBRyxDQUFDLEtBQUssRUFBRSxDQUFDLE9BQU8sRUFBRSxTQUFTLEVBQUUsY0FBYyxDQUFDLEVBQUUsRUFBRTtZQUNoRSxJQUFJO2dCQUNGLHNGQUFzRjtnQkFDdEYsNkVBQTZFO2dCQUM3RSxNQUFNLFNBQVMsR0FBRyxNQUFNLElBQUksQ0FBQyxRQUFRLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FDdkQsT0FBTyxFQUNQLFNBQVMsRUFDVCxjQUFjLEVBQ2Q7b0JBQ0UsUUFBUSxFQUFFLElBQUksQ0FBQyxlQUFlO29CQUM5QixRQUFRLEVBQUUsY0FBYyxhQUFkLGNBQWMsdUJBQWQsY0FBYyxDQUFFLFdBQVc7aUJBQ3RDLENBQ0YsQ0FBQztnQkFDRixPQUFPLEVBQUUsT0FBTyxFQUFFLEdBQUcsU0FBUyxFQUFFLENBQUM7YUFDbEM7WUFBQyxPQUFPLEdBQUcsRUFBRTtnQkFDWixHQUFHLENBQUMsS0FBSyxDQUNQLEVBQUUsR0FBRyxFQUFFLEVBQ1AsNkNBQTZDLE9BQU8sRUFBRSxDQUN2RCxDQUFDO2dCQUNGLHlEQUF5RDtnQkFDekQsNkRBQTZEO2dCQUM3RCxvR0FBb0c7Z0JBQ3BHLE9BQU8sRUFBRSxPQUFPLEVBQUUsU0FBUyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsU0FBUyxFQUFFLENBQUM7YUFDakU7UUFDSCxDQUFDLENBQUMsQ0FDSCxDQUFDO1FBRUYsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUUsRUFBRSxFQUFFO1lBQ3JELElBQUksU0FBUyxJQUFJLFVBQVUsRUFBRTtnQkFDM0IsYUFBYSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsU0FBUyxFQUFFLFVBQVUsRUFBRSxDQUFDO2FBQ3BEO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxPQUFPLGFBQWEsQ0FBQztJQUN2QixDQUFDO0NBQ0YifQ==