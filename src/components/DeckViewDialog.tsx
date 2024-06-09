// import { useGameStore } from "../state";
// import { Option } from "../helpers/chooseWeightedOption.ts";
//
// const GoalChooserDialog = () => {
//   const { deckLooking, toggleDeckView, boards } = useGameStore();
//   // TODO: make this not fixed to 0.
//   const deck = boards[0]?.deck;
//   if (!deck) return;
//
//   const colourMap = {
//     W: "bg-blue-300",
//     F: "bg-red-300",
//     A: "bg-amber-300",
//     E: "bg-green-300",
//   };
//
//   const tileRender = (t: Option, ix: number) => {
//     const value = t.value || 2;
//     return (
//       <div
//         key={ix}
//         className={`
//                   w-10 h-10 ${colourMap[t.id as keyof typeof colourMap]}
//                   rounded flex items-center justify-center
//                   animate-growIn
//                   ${value.toString().indexOf("$") > -1 && "cursor-pointer"}
//                 `}
//         style={{
//           position: "relative",
//         }}
//       >
//         <span className="text-gray-600 font-bold text-xl">{value}</span>
//         <span
//           style={{ position: "absolute", top: 4, left: 4 }}
//           className="text-gray-700 font-bold text-xs"
//         >
//           {t.id}
//         </span>
//       </div>
//     );
//   };
//
//   return (
//     <>
//       <div
//         hidden={!deckLooking}
//         className={`
//           bg-gray-200 shadow-2xl absolute top-1/4 left-1/4 w-1/2 h-fit z-20
//         `}
//       >
//         <div className="flex">
//           {deck.map((rt, rtIx) => {
//             return tileRender(rt, rtIx);
//           })}
//         </div>
//         <button onClick={toggleDeckView}>Close Deck View</button>
//       </div>
//     </>
//   );
// };
//
// export default GoalChooserDialog;
