function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <header className="mb-6 rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-2xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] text-cyan-400 uppercase">
                HANYU WAREHOUSE
              </p>
              <h1 className="mt-2 text-2xl font-bold md:text-3xl">涵宇仓库 PWA</h1>
              <p className="mt-2 text-sm text-slate-400">
                阶段五 · 独立前端骨架（UI UX PRO MAX）
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:w-[320px]">
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">环境</p>
                <p className="mt-1 text-sm font-semibold text-emerald-400">DEV ONLINE</p>
              </div>
              <div className="rounded-2xl border border-slate-800 bg-slate-950 p-3">
                <p className="text-xs text-slate-400">阶段</p>
                <p className="mt-1 text-sm font-semibold text-cyan-400">S2</p>
              </div>
            </div>
          </div>
        </header>

        <main className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-4">
            <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">01</p>
            <h2 className="mt-2 text-lg font-semibold">拍照 / 说明区</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              后面放拍照入口、图片预览、识别说明。
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-8">
            <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">02</p>
            <h2 className="mt-2 text-lg font-semibold">识别结果区</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              后面放 vision 返回结果、原始识别内容。
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-7">
            <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">03</p>
            <h2 className="mt-2 text-lg font-semibold">主字段校对区</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              后面放 f01 / f02 / f03 / f04 / f05 / f08 / f10 / f11。
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-5">
            <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">04</p>
            <h2 className="mt-2 text-lg font-semibold">预埋区</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              后面放 batch_no、外袋码、回料相关键。
            </p>
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900 p-5 shadow-xl lg:col-span-12">
            <p className="text-xs font-medium tracking-[0.2em] text-slate-400 uppercase">05</p>
            <h2 className="mt-2 text-lg font-semibold">提交结果区</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">
              后面放建草稿结果、draft.name、错误提示。
            </p>
          </section>
        </main>
      </div>
    </div>
  )
}

export default App
