import {
  chainIdNetworkParamsMapping,
  didMethodChainIdMapping,
  MethodsRequiringNetwork,
} from '@blockchain-lab-um/masca-types';
import { divider, heading, panel, text } from '@metamask/snaps-ui';

import { snapConfirm } from './utils/snapUtils';

class EthereumService {
  /**
   * Function that returns the current network.
   *
   * @returns string - current network.
   */
  static async getNetwork(): Promise<string> {
    const network = (await ethereum.request({
      method: 'eth_chainId',
    })) as string;

    return network;
  }

  static async requestNetworkSwitch(args: {
    didMethod: MethodsRequiringNetwork;
  }): Promise<void> {
    const { didMethod } = args;
    const content = panel([
      heading('Switch Network'),
      text(
        `${didMethod} is not available for your currently selected network. Would you like to switch your network?`
      ),
      divider(),
      text(
        `Switching to: ${didMethod} on chainId: ${didMethodChainIdMapping[didMethod][0]}`
      ),
    ]);
    if (!(await snapConfirm(content))) {
      throw new Error('User rejected network switch');
    }
    const chainId = didMethodChainIdMapping[didMethod][0];
    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
    } catch (err) {
      if (
        (err as { code?: number; message: string; stack: string }).code === 4902
      ) {
        await ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [chainIdNetworkParamsMapping[chainId]],
        });
      }
      throw err as Error;
    }
  }

  static async handleNetwork(args: {
    didMethod: MethodsRequiringNetwork;
  }): Promise<void> {
    const { didMethod } = args;
    const chainId = await this.getNetwork();

    if (
      !didMethodChainIdMapping[didMethod].includes(chainId) &&
      !didMethodChainIdMapping[didMethod].includes('*')
    ) {
      await this.requestNetworkSwitch({ didMethod });
    }
  }
}

export default EthereumService;
