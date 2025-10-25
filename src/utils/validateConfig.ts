import {
  type FreezeTokenPayment,
  type GuardSet,
  type TokenPayment,
} from "@metaplex-foundation/mpl-candy-machine";
import { fetchToken } from "@metaplex-foundation/mpl-toolbox";
import type { PublicKey, Some, Umi } from "@metaplex-foundation/umi";
import { message } from 'ant-design-vue';

export const checkAtaValid = (
  umi: Umi,
  guards: { label: string; guards: GuardSet }[]
) => {
    console.log("checkAtaValid")
  const atas: PublicKey[] = [];
  guards.forEach((guard) => {
    if (guard.guards.tokenPayment.__option === "Some") {
      const tokenPayment = guard.guards.tokenPayment as Some<TokenPayment>;
      atas.push(tokenPayment.value.destinationAta);
    }
    if (guard.guards.freezeTokenPayment.__option === "Some") {
      const freezeTokenPayment = guard.guards
        .freezeTokenPayment as Some<FreezeTokenPayment>;
      atas.push(freezeTokenPayment.value.destinationAta);
    }
  });
  atas.forEach((ata) => {
    fetchToken(umi, ata).catch((e) => {
      console.log(e);
      message.error(`${ata} is not a Associated Token Account! Minting will fail!`);
    });
  });
  return;
};
