import svgPaths from "./svg-pry7zm8quq";

function Container1() {
  return <div className="absolute border-[#e0e0e0] border-l-[1.833px] border-solid h-[117.309px] left-[71.97px] top-0 w-[1.833px]" data-name="Container" />;
}

function Container2() {
  return <div className="absolute bg-[#f5f0eb] left-[-10px] rounded-[61503700px] size-[19.991px] top-[48.66px]" data-name="Container" />;
}

function Container3() {
  return <div className="absolute bg-[#f5f0eb] left-[350.29px] rounded-[61503700px] size-[19.991px] top-[48.66px]" data-name="Container" />;
}

function Icon() {
  return (
    <div className="relative shrink-0 size-[21.995px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 21.9954 21.9954">
        <g clipPath="url(#clip0_8_432)" id="Icon">
          <path d={svgPaths.pd0c7a80} id="Vector" stroke="var(--stroke-0, #FF7A00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.83295" />
        </g>
        <defs>
          <clipPath id="clip0_8_432">
            <rect fill="white" height="21.9954" width="21.9954" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Container6() {
  return (
    <div className="bg-[rgba(255,122,0,0.08)] relative rounded-[16px] shrink-0 size-[47.972px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center pr-[0.029px] relative size-full">
        <Icon />
      </div>
    </div>
  );
}

function Text() {
  return (
    <div className="h-[23.943px] relative shrink-0 w-[51.981px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="-translate-x-1/2 absolute font-['Poppins:SemiBold',sans-serif] leading-[12px] left-[26.21px] not-italic text-[#999] text-[8px] text-center top-[-1.83px] w-[31px]">Orange Money</p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[75.896px] relative shrink-0 w-[51.981px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[3.981px] items-center relative size-full">
        <Container6 />
        <Text />
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="absolute content-stretch flex h-[20.993px] items-start left-0 top-0 w-[260.365px]" data-name="Text">
      <p className="flex-[1_0_0] font-['Poppins:Bold',sans-serif] leading-[21px] min-h-px min-w-px not-italic relative text-[#111] text-[14px]">1 000 FCFA offerts</p>
    </div>
  );
}

function Text2() {
  return (
    <div className="absolute content-stretch flex h-[14.979px] items-start left-0 top-[22.97px] w-[260.365px]" data-name="Text">
      <p className="flex-[1_0_0] font-['Poppins:Medium',sans-serif] leading-[15px] min-h-px min-w-px not-italic relative text-[#5b5b5b] text-[10px]">Credites sur votre wallet IPPOO CASH</p>
    </div>
  );
}

function Text3() {
  return (
    <div className="absolute h-[11.971px] left-0 top-[41.93px] w-[260.365px]" data-name="Text">
      <p className="absolute font-['Poppins:Medium',sans-serif] leading-[12px] left-0 not-italic text-[#999] text-[8px] top-[-1.83px] whitespace-nowrap">1er paiement via Orange Money</p>
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[11.971px] relative shrink-0 w-[82.082px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Poppins:Medium',sans-serif] leading-[12px] left-0 not-italic text-[#ccc] text-[8px] top-[-1.83px] whitespace-nowrap">Expire : 31 mars 2026</p>
      </div>
    </div>
  );
}

function Icon1() {
  return (
    <div className="absolute left-[10px] size-[8.993px] top-[6.21px]" data-name="Icon">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.99293 8.99293">
        <g clipPath="url(#clip0_8_428)" id="Icon">
          <path d={svgPaths.p3dd78700} id="Vector" stroke="var(--stroke-0, #FF7A00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.749411" />
          <path d={svgPaths.p27e34fc0} id="Vector_2" stroke="var(--stroke-0, #FF7A00)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.749411" />
        </g>
        <defs>
          <clipPath id="clip0_8_428">
            <rect fill="white" height="8.99293" width="8.99293" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="bg-[rgba(255,122,0,0.06)] h-[21.451px] relative rounded-[12px] shrink-0 w-[92.049px]" data-name="Button">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Icon1 />
        <p className="-translate-x-1/2 absolute font-['Poppins:Bold',sans-serif] leading-[13.5px] left-[53.47px] not-italic text-[#ff7a00] text-[9px] text-center top-[3.98px] whitespace-nowrap">{` ORANGE1000`}</p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex h-[21.451px] items-center justify-between left-0 top-[63.9px] w-[260.365px]" data-name="Container">
      <Text4 />
      <Button />
    </div>
  );
}

function Container7() {
  return (
    <div className="flex-[1_0_0] h-[85.347px] min-h-px min-w-px relative" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <Text1 />
        <Text2 />
        <Text3 />
        <Container8 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute content-stretch flex gap-[15.981px] h-[85.347px] items-start left-[15.98px] top-[15.98px] w-[328.328px]" data-name="Container">
      <Container5 />
      <Container7 />
    </div>
  );
}

export default function Container() {
  return (
    <div className="bg-white overflow-clip relative rounded-[16px] shadow-[0px_4px_16px_0px_rgba(0,0,0,0.06)] size-full" data-name="Container">
      <Container1 />
      <Container2 />
      <Container3 />
      <Container4 />
    </div>
  );
}