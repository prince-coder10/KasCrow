import useSidebar from "../../hooks/useSidebarContext";

function DashboardLayout() {
  const { navOpen } = useSidebar();
  return (
    <div
      className={` w-full max-w-full overflow-x-hidden flex flex-col justify-center items-center p-5 ${navOpen ? "ml-64" : "ml-10"} transition-all duration-300 ease-in-out`}
    >
      {/* Section 1 */}
      <div className="w-full flex flex-col gap-3  md:flex-row md:justify-between md:items-center">
        <div className="flex flex-col gap-2">
          <p className="w-30 h-8 bg-card shimmer"></p>
          <p className="w-45 h-4 bg-card shimmer"></p>
        </div>
        <div>
          <div className="bg-card px-20 py-6 rounded-xl shimmer"></div>
        </div>
      </div>
      {/* Section 2 */}
      <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-5 mt-10">
        <div className="bg-card w-full h-35 rounded-xl shimmer"></div>
        <div className="bg-card w-full h-35 rounded-xl shimmer"></div>
        <div className="bg-card w-full h-35 rounded-xl shimmer "></div>
        <div className="bg-card w-full h-35 rounded-xl shimmer "></div>
      </div>
      {/* Section 3 */}
      <div className=" w-full mt-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="w-30 h-6 bg-card shimmer"></p>
          <p className="w-15 h-4 bg-card shimmer"></p>
        </div>
        {/* history */}
        <div className="flex md:flex-row flex-col gap-3 md:justify-evenly md:items-center mt-5 ">
          {/* first child */}
          <div className="flex gap-4 items-center ">
            <div className="size-10 rounded-full bg-card shimmer"></div>
            <div className="flex flex-col gap-2">
              <p className="w-50 h-4 bg-card shimmer"></p>
              <p className="w-20 h-3 bg-card shimmer"></p>
            </div>
          </div>
          {/* second child */}
          <div className="flex gap-10 justify-between md:items-center ">
            {/* value */}
            <div className="flex flex-col gap-2 items-end justify-end">
              <p className="w-15 h-3 bg-card text-right shimmer"></p>
              <p className="w-35 h-4 bg-card shimmer"></p>
            </div>
            {/* Status */}
            <div className="flex flex-col gap-2 items-end justify-end">
              <p className="w-15 h-3 bg-card text-right shimmer"></p>
              <p className="w-20 h-4 bg-card shimmer"></p>
            </div>
          </div>
        </div>
        {/* history */}
        <div className="flex md:flex-row flex-col gap-3 justify-evenly md:items-center mt-5 ">
          {/* first child */}
          <div className="flex gap-4 items-center ">
            <div className="size-10 rounded-full bg-card shimmer"></div>
            <div className="flex flex-col gap-2">
              <p className="w-50 h-4 bg-card shimmer"></p>
              <p className="w-20 h-3 bg-card shimmer"></p>
            </div>
          </div>
          {/* second child */}
          <div className="flex gap-10 justify-between md:items-center ">
            {/* value */}
            <div className="flex flex-col gap-2 items-end justify-end">
              <p className="w-15 h-3 bg-card text-right shimmer"></p>
              <p className="w-35 h-4 bg-card shimmer"></p>
            </div>
            {/* Status */}
            <div className="flex flex-col gap-2 items-end justify-end">
              <p className="w-15 h-3 bg-card text-right shimmer"></p>
              <p className="w-20 h-4 bg-card shimmer"></p>
            </div>
          </div>
        </div>
        {/* history */}
        <div className="flex md:flex-row flex-col gap-3 justify-evenly md:items-center mt-5 ">
          {/* first child */}
          <div className="flex gap-4 items-center ">
            <div className="size-10 rounded-full bg-card shimmer"></div>
            <div className="flex flex-col gap-2">
              <p className="w-50 h-4 bg-card shimmer"></p>
              <p className="w-20 h-3 bg-card shimmer"></p>
            </div>
          </div>
          {/* second child */}
          <div className="flex gap-10 justify-between md:items-center ">
            {/* value */}
            <div className="flex flex-col gap-2 items-end justify-end">
              <p className="w-15 h-3 bg-card text-right shimmer"></p>
              <p className="w-35 h-4 bg-card shimmer"></p>
            </div>
            {/* Status */}
            <div className="flex flex-col gap-2 items-end justify-end">
              <p className="w-15 h-3 bg-card text-right shimmer"></p>
              <p className="w-20 h-4 bg-card shimmer"></p>
            </div>
          </div>
        </div>
      </div>
      {/* Section 4 */}
      <div className=" w-full mt-10 flex justify-center">
        <div className="bg-card w-full h-25 rounded-xl shimmer"></div>
      </div>
    </div>
  );
}

export default DashboardLayout;
