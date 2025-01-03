import { useEffect, useMemo, useState } from "react";
import { SDK, createDojoStore } from "@dojoengine/sdk";
import { getEntityIdFromKeys } from "@dojoengine/utils";
import { Account, addAddressPadding } from "starknet";
import { Models, Schema } from "./dojo/bindings.ts";
import { useDojo } from "./dojo/useDojo.tsx";
import useModel from "./dojo/useModel.tsx";
import { useSystemCalls } from "./dojo/useSystemCalls.ts";
import { Card, CardContent } from './components/ui/card.tsx';
import { Progress } from './components/ui/progress';
import { Button } from './components/ui/button';
import { useAccount } from "@starknet-react/core";
import { Heart, Pizza, Coffee, Bath, Gamepad2, Sun, Swords, ShieldPlus, TestTubeDiagonal, CircleGauge, } from 'lucide-react';

import sleep from './img/sleep.gif';
import eat from './img/eat.gif';
import play from './img/play.gif';
import shower from './img/shower.gif';
import happy from './img/happy.gif';
import dead from './img/dead.gif';
import Header from "./components/Header/index.tsx";
import Play from "./components/Play/index.tsx";

import beastie from "./data/beast.ts";

export const useDojoStore = createDojoStore<Schema>();

function App({ sdk }: { sdk: SDK<Schema> }) {
  const { account } = useAccount();

  const {
    setup: { client },
  } = useDojo();
  const { spawn } = useSystemCalls();
  const state = useDojoStore((state) => state);

  const entityId = useMemo(
    () => account?.address ? getEntityIdFromKeys([BigInt(account.address)]) : null,
    [account?.address]
  );

  const beastData = useModel(entityId ?? "", Models.Beast);
  const [beast, setBeast] = useState(beastData || beastie);

  // Trigger build
  useEffect(() => {
    setBeast(beastData || beastie);
  }, [beastData, beastie]);

  useEffect(() => {
    if (!account) return
    let unsubscribe: (() => void) | undefined;

    const subscribe = async () => {

      const subscription = await sdk.subscribeEntityQuery(
        {
          dojo_starter: {
            Beast: {
              $: {
                where: {
                  player: {
                    $is: addAddressPadding(
                      account.address
                    ),
                  },
                },
              },
            },
          },
        },
        (response) => {
          if (response.error) {
            console.error(
              "Error setting up entity sync:",
              response.error
            );
          } else if (
            response.data &&
            response.data[0].entityId !== "0x0"
          ) {
            state.updateEntity(response.data[0]);
          }
        },
        { logging: true }
      );

      unsubscribe = () => subscription.cancel();
    };

    subscribe();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [sdk, account]);

  useEffect(() => {
    if (!account) return
    const fetchEntities = async () => {
      try {
        await sdk.getEntities(
          {
            dojo_starter: {
              Beast: {
                $: {
                  where: {
                    player: {
                      $eq: addAddressPadding(
                        account.address
                      ),
                    },
                  },
                },
              },
            },
          },
          (resp) => {
            if (resp.error) {
              console.error(
                "resp.error.message:",
                resp.error.message
              );
              return;
            }
            if (resp.data) {
              state.setEntities(resp.data);
            }
          }
        );
      } catch (error) {
        console.error("Error querying entities:", error);
      }
    };

    fetchEntities();
  }, [sdk, account]);


  // Animations
  const [currentImage, setCurrentImage] = useState(happy);
  const showAnimationWithoutTimer = (gifPath: string) => {
    setCurrentImage(gifPath);
  };
  const showAnimation = (gifPath: string) => {
    setCurrentImage(gifPath);
    setTimeout(() => {
      setCurrentImage(happy);
    }, 1000000);
  };
  const showDeathAnimation = () => {
    setCurrentImage(dead);
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      if (beast?.is_alive && account) {
        await client.actions.decreaseStats(account as Account);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [beast?.is_alive]);

  useEffect(() => {
    if (beast?.is_alive == false) {
      showDeathAnimation();
    }
  }, [beast?.is_alive]);

  return (
    <>
      <Header />
      {
        beast || beastie ?
          <div className="tamaguchi">
            <>
              <Card>
                <CardContent>
                  <div className="space-y-6">
                    {/* Centered Tamagotchi Image */}
                    <div className="scenario flex justify-center items-column">
                      <img src={currentImage} alt="Tamagotchi" className="w-40 h-40" />
                    </div>

                    {/* Action Buttons */}
                    <p className='title mt-2'>
                      Keep your BabyBeast happy and healthy
                      <span> Interact with him and level him up!</span>
                    </p>
                    <div className="actions mt-3 mb-0">
                      <Button
                        onClick={async () => {
                          if (account) {
                            await client.actions.feed(account as Account);
                          }
                          if (beast.is_alive) showAnimation(eat);
                        }}
                        disabled={!beast.is_alive}
                        className="flex items-center button"
                      >
                        <Pizza /> Feed
                      </Button>
                      <Button
                        onClick={async () => {
                          if (account) {
                            await client.actions.sleep(account as Account);
                          }
                          if (beast.is_alive) showAnimationWithoutTimer(sleep);
                        }}
                        disabled={!beast.is_alive}
                        className="flex items-center button"
                      >
                        <Coffee /> Sleep
                      </Button>
                      <Button
                        onClick={async () => {
                          if (account) {
                            await client.actions.play(account as Account);
                          }
                          if (beast.is_alive) showAnimation(play);
                        }}
                        disabled={!beast.is_alive}
                        className="flex items-center button"
                      >
                        <Gamepad2 /> Play
                      </Button>
                      <Button
                        onClick={async () => {
                          if (account) {
                            await client.actions.clean(account as Account);
                          }
                          if (beast.is_alive) showAnimation(shower);
                        }}
                        disabled={!beast.is_alive}
                        className="flex items-center button"
                      >
                        <Bath /> Clean
                      </Button>
                      <Button
                        onClick={async () => {
                          if (account) {
                            await client.actions.awake(account as Account);
                          }
                          if (beast.is_alive) setCurrentImage(happy);
                        }}
                        disabled={!beast.is_alive}
                        className="flex items-center button"
                      >
                        <Sun /> Wake Up
                      </Button>
                      <Button
                        onClick={async () => {
                          if (account) {
                            await client.actions.revive(account as Account);
                          }
                          setCurrentImage(happy);
                        }}
                        disabled={beast.is_alive}
                        className="flex items-center button"
                      >
                        <Sun /> Revive
                      </Button>
                    </div>
                    <p className="info mt-3 mb-5">You can revive your baby beast, but this one is gonna loose the experience earhed</p>

                    {/* Hunger Bar */}
                    <div className="flex items-center  mb-1">
                      <Heart className="text-red-500" />
                      <Progress value={beast.energy} />
                      <span className="w-12 text-right font-medium text-white">{Math.round(beast.energy)}%</span>
                    </div>
                    <p className="info mt-0">Energy</p>

                    {/* Energy Bar */}
                    <div className="flex items-center  mt-2 mb-1">
                      <Coffee className="text-yellow-600" />
                      <Progress value={beast.hunger} />
                      <span className="w-12 text-right font-medium text-white">{Math.round(beast.hunger)}%</span>
                    </div>
                    <p className="info mt-0">Hunger</p>

                    {/* Happiness Bar */}
                    <div className="flex items-center  mt-2 mb-1">
                      <Gamepad2 className="text-green-500" />
                      <Progress value={beast.happiness} />
                      <span className="w-12 text-right font-medium text-white">{Math.round(beast.happiness)}%</span>
                    </div>
                    <p className="info mt-0">Happiness</p>

                    {/* Hygiene Bar */}
                    <div className="flex items-center  mt-2 mb-1">
                      <Bath className="text-blue-500" />
                      <Progress value={beast.hygiene} />
                      <span className="w-12 text-right font-medium text-white">{Math.round(beast.hygiene)}%</span>
                    </div>
                    <p className="info mt-0">Hygiene</p>

                    <p className='title mt-5 text-center'>
                      <span className="d-block">BabyBeast Stats</span>
                      The stats of your BabyBeast will increase with more levels
                    </p>

                    {/* Hunger Bar */}
                    <div className="flex items-center  mb-1">
                      <Swords className="text-red-500" />
                      <Progress value={beast.attack} />
                      <span className="w-12 text-right font-medium text-white">{Math.round(beast.attack)}</span>
                    </div>
                    <p className="info mt-0">Attack</p>

                    {/* Energy Bar */}
                    <div className="flex items-center  mt-2 mb-1">
                      <ShieldPlus className="text-yellow-600" />
                      <Progress value={beast.defense} />
                      <span className="w-12 text-right font-medium text-white">{Math.round(beast.defense)}</span>
                    </div>
                    <p className="info mt-0">Defense</p>

                    {/* Happiness Bar */}
                    <div className="flex items-center  mt-2 mb-1">
                      <CircleGauge className="text-green-500" />
                      <Progress value={beast.speed} />
                      <span className="w-12 text-right font-medium text-white">{Math.round(beast.speed)}</span>
                    </div>
                    <p className="info mt-0">Speed</p>

                    {/* Hygiene Bar */}
                    <div className="flex items-center  mt-2 mb-1">
                      <TestTubeDiagonal className="text-blue-500" />
                      <Progress value={beast.experience} />
                      <span className="w-12 text-right font-medium text-white">{(beast.experience)}</span>
                    </div>
                    <p className="info mt-0">{beast.next_level_experience} experience points to reach next level</p>
                  </div>
                </CardContent>
              </Card>
            </>
          </div>
          :
          <div className="cover">
            <Play />
            <button
              disabled={account ? false : true}
              className="button"
              onClick={async () => {
                await spawn();
                location.reload();
              }}>Spawn your BabyBeast
            </button>
          </div>
      }
    </>
  );
}

export default App;
