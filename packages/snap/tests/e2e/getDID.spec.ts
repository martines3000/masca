import { isError, Result } from '@blockchain-lab-um/utils';
import { MetaMaskInpageProvider } from '@metamask/providers';
import type { SnapsGlobalObject } from '@metamask/snaps-types';

import { onRpcRequest } from '../../src';
import { account } from '../data/constants';
import { getDefaultSnapState } from '../data/defaultSnapState';
import { createMockSnap, SnapMock } from '../helpers/snapMock';

// TODO verify that these are the correct dids (after keypair implementation is complete and final mappings are set)
const methods = [
  {
    method: 'did:key',
    did: 'did:key:zQ3shnhrtE43gzU9bFdGFPnDrVSmGWUZmnKinSw8LBvrWmHop',
  },
  {
    method: 'did:jwk',
    did: 'did:jwk:eyJhbGciOiJFUzI1NksiLCJjcnYiOiJzZWNwMjU2azEiLCJrdHkiOiJFQyIsInVzZSI6InNpZyIsIngiOiJ6SnF0WXBPQUYtMTJlQ0J3ZEh5cFJGeXJKX3J3SXUxMXNvOFluWWxuZktrIiwieSI6Inh1S1ZfcTA1alJ0MTN4TW03LWpfSDR6RjdtdWpPVW1yZHZGekpnNEN0RG8ifQ',
  },
  {
    method: 'did:key:jwk_jcs-pub',
    underlyingMethod: 'did:key',
    did: 'did:key:z2dmzD81cgPx8Vki7JbuuMmFYrWPgYoytykUZ3eyqht1j9KbpyYP9DZqXwj4ruiFfhsUonrVvKD9T86HCnNriWZbv6vxZvUy9eV6QvED6UsvXxT9cEjMSE9gaWyYGCvaMuSmjhXz4NTsY1pSSsd7fJuJq8gsaAyHEMvdCRCbTR45JD42TW',
  },
  {
    method: 'did:ethr',
    did: 'did:ethr:0x1:0xb6665128eE91D84590f70c3268765384A9CAfBCd',
  },
  {
    method: 'did:pkh',
    did: 'did:pkh:eip155:0x1:0xb6665128eE91D84590f70c3268765384A9CAfBCd',
  },
];

describe('getDID', () => {
  let snapMock: SnapsGlobalObject & SnapMock;

  beforeAll(async () => {
    snapMock = createMockSnap();
    snapMock.rpcMocks.snap_manageState({
      operation: 'update',
      newState: getDefaultSnapState(account),
    });
    snapMock.rpcMocks.snap_dialog.mockReturnValue(true);
    global.snap = snapMock;
    global.ethereum = snapMock as unknown as MetaMaskInpageProvider;
  });

  it.each(methods)(
    'should return correct identifier for $method',
    async (methodObj) => {
      const switchMethod = (await onRpcRequest({
        origin: 'localhost',
        request: {
          id: 'test-id',
          jsonrpc: '2.0',
          method: 'switchDIDMethod',
          params: {
            didMethod: methodObj.method,
          },
        },
      })) as Result<string>;

      if (isError(switchMethod)) {
        throw new Error(switchMethod.error);
      }

      if (methodObj.underlyingMethod) {
        expect(
          switchMethod.data.substring(0, methodObj.underlyingMethod.length)
        ).toBe(methodObj.underlyingMethod);
      } else {
        expect(switchMethod.data.substring(0, methodObj.method.length)).toBe(
          methodObj.method
        );
      }

      const did = (await onRpcRequest({
        origin: 'localhost',
        request: {
          id: 'test-id',
          jsonrpc: '2.0',
          method: 'getDID',
          params: {},
        },
      })) as Result<unknown>;

      if (isError(did)) {
        throw new Error(did.error);
      }

      expect(did.data).toBe(methodObj.did);
      expect.assertions(2);
    }
  );
});
