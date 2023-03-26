import React, { useState, useEffect } from "react";
import { 
  usePrepareContractWrite, 
  useContractWrite, 
  useWaitForTransaction,
  useNetwork,
  useAccount 
} from 'wagmi';
import {
  MdElectricCar,
  MdAttachMoney,
  MdOutlineElectricBolt,
} from "react-icons/md";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { BsChevronDown, BsChevronUp } from "react-icons/bs";
import { GiPathDistance } from "react-icons/gi";
import { BiCurrentLocation } from "react-icons/bi";
import ABI from "../../../src/abi.json";
import useDebounce from "../../../utils/useDebounce";

function Offer(props) {
  const [isopen, setIsopen] = useState(false);
  const account = useAccount();
  const {chain, chains} = useNetwork();
  const debouncedOfferid = useDebounce(props.id, 500);

  function totalCalc(price, amount) {
    return amount * price ;
  }

  const contractAddress = process.env.NEXT_PUBLIC_MARKET_CONTRACT_ADDRESS;
  const { config: configConfirm, error: errorConfirm } = usePrepareContractWrite({
    address: contractAddress,
    abi: ABI,
    chainId: chain.id,
    functionName: 'completeOffer',
    args: [debouncedOfferid],
    enabled: Boolean(debouncedOfferid),
  });


  const { data: dataConfirm, write: writeConfirm, isError: isConfirmError } = useContractWrite(configConfirm);
  console.log({configConfirm});
  console.log({errorConfirm});
  const { isLoading: isConfirmLoading, isSuccess: isConfirmSuccess } = useWaitForTransaction({
  hash: dataConfirm?.hash,
  }) 


  const notify = (opt) => {
    const notifyObj = {
      position: "top-center",
      text: "19px",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "dark",
    };
    switch (opt) {
      case "notFound":
        toast.error(
          "Offer not found !",
          notifyObj
        );
        break;
      case "cancelSuccessPolybase":
        toast.success("Canceled on Polybase!", {
          ...notifyObj,
          theme: "light",
        });
        break;
      case "confirmSuccessPolybase":
        toast.success("Confirmed on Polybase!", {
          ...notifyObj,
          theme: "light",
        });
        break;
      case "confirmSuccessChain":
        toast.success("Confirmed on chain!", {
          ...notifyObj,
          theme: "light",
        });
        break;
      case "offerAlreadyConfirmed":
        toast.error("Offer already confirmed!", notifyObj);
        break;
      case "cancelSuccessChain":
        toast.success("Deleted offer on-chain!", {
          ...notifyObj,
          theme: "light",
        });
        break;
    }
  };

  const handleCancelOffer = async ()=> {
    const currentTime = new Date().getTime();
    const offerCancelObj = {
      offerID: props.id,
      userAccount: account.address,
      amount: props.amount,
      price: props.price,
      location: props.address,
      updateTime: currentTime,
    };
    console.log(offerCancelObj);
    const response = await fetch("/api/canceloffer", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(offerCancelObj),
    });
  
    if (response.status == 201) {
      notify("cancelSuccessPolybase");
    } else if (response.status == 404) {
      notify("notFound");
    }
  }

  useEffect(() => {
      if (isConfirmSuccess) {
        handleConfirmOffer();
      }
    }
  );

  const handleConfirmOffer = async ()=> {
    const currentTime = new Date().getTime();
    const offerConfirmObj = {
      offerID: props.id,
      userAccount: account.address,
      amount: props.amount,
      price: props.price,
      location: props.address,
      updateTime: currentTime,
    };
    console.log(offerConfirmObj);
    const response = await fetch("/api/completeOffer", {
      method: "POST",
      mode: "cors",
      cache: "no-cache",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(offerConfirmObj),
    });
  
    if (response.status == 201) {
      notify("confirmSuccessPolybase");
    } else if (response.status == 400){
      notify("offerAlreadyConfirmed");
    } else if (response.status == 404) {
      notify("notFound");
    }
  }

  return (
    <div>
      {!isopen && (
        <div
          onClick={() => setIsopen(!isopen)}
          className="p-2 flex justify-between bg-[#0f1421] rounded-[10px] border-[1px] border-[#26365A] text-[15px] md:text-[18px] font-kanit hover:cursor-pointer mt-3"
        >
          <div className="flex">
            <MdElectricCar className="mt-[4px] text-[24px] mr-1 md:mr-2 text-blue-500" />
            <p className="mr-1 md:mr-2 ">Amount : ~{props.amount} KWH</p>
          </div>
          <div className="flex">
            <p className="mr-1 md:mr-2">${props.price.toFixed(2)} / KWH</p>
            <BsChevronDown className="text-blue-500 text-[24px] mt-[3px]" />
          </div>
        </div>
      )}
      {isopen && (
        <div className="p-2 justify-between bg-[#0f1421] rounded-[10px] border-[1px] border-[#26365A] text-[15px] md:text-[18px] font-kanit hover:cursor-pointer mt-3">
          <div>
            <div
              className="flex justify-between "
              onClick={() => setIsopen(!isopen)}
            >
              <div className="flex">
                <MdElectricCar className="mt-[4px] mr-1 md:mr-2 text-blue-500  text-[24px]" />
                <p className="text-[18px] flex mt-[2px]">
                  <p className="font-bold mr-2 underline">Offer:</p> {props.id}
                </p>
              </div>
              <BsChevronUp className="text-blue-500 mt-[1px]  text-[24px]" />
            </div>
          </div>
          <div className="flex mt-2">
            <MdAttachMoney className="mt-[4px] mr-1 md:mr-2 text-blue-500  text-[24px]" />
            <p className="text-[18px] flex mt-[2px]">
              <p className="font-bold mr-2 underline">Price Rate:</p> $
              {props.price} per KWH
            </p>
          </div>
          <div className="flex mt-2">
            <MdOutlineElectricBolt className="mt-[4px] mr-1 md:mr-2 text-blue-500  text-[24px]" />
            <p className="text-[18px] flex mt-[2px]">
              <p className="font-bold mr-2 underline">Amount:</p>
              {props.amount} KWH
            </p>
          </div>
          <div className="flex mt-2">
            <BiCurrentLocation className="mt-[4px] mr-1 md:mr-2 text-blue-500  text-[24px]" />
            <p className="text-[18px] flex mt-[2px]">
              <p className="font-bold mr-2 underline">Location:</p>{" "}
            </p>
          </div>
          <p className="mt-2 ml-2 truncate">{props.address}</p>
          <div className="flex justify-between px-1 mt-4">
            <div className="flex mt-2">
              <p className="text-xl font-bold flex ">Total Paid:</p>
              <p className="text-xl font-bold text-blue-500 ml-2 ">
                {totalCalc(props.price, props.amount).toFixed(2)} USD
              </p>
            </div>
          </div>
          <div className="flex justify-between mt-6 mx-2">
            <div 
              onClick={handleCancelOffer}
              className="p-2  bg-red-600 text-white  rounded-[10px] mb-1">
              Cancel Offer
            </div>
            <div 
              disable={!writeConfirm}
              onClick={() => writeConfirm?.()}
              className="p-2  bg-[#26365A] text-blue-400 hover:text-[#5285F6] rounded-[10px] mb-1">
              Mark as completed
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Offer;
