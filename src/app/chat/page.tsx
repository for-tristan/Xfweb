'use client';

import { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePageFeatures } from '@/lib/usePageFeatures';
import { AuthGate, HeroEffects } from '@/lib/PageModals';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';


interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  isStreaming?: boolean;
}

const SUGGESTIONS = [
  { icon: 'fa-solid fa-code', label: 'Write code', desc: 'Help me build a React component' },
  { icon: 'fa-solid fa-bug', label: 'Debug an issue', desc: 'Find and fix bugs in my code' },
  { icon: 'fa-solid fa-graduation-cap', label: 'Learn something', desc: 'Explain a concept or technology' },
  { icon: 'fa-solid fa-lightbulb', label: 'Brainstorm ideas', desc: 'Generate creative project ideas' },
];


function ChatLogo({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}
    >
      <path d="M0 0 C0 4.29 0 8.58 0 13 C-1.93875 13.37125 -3.8775 13.7425 -5.875 14.125 C-20.90298428 17.70772333 -30.48036743 28.3736136 -40.2421875 39.7578125 C-44.8734711 45.0984732 -49.91922977 50.02690869 -54.9375 55 C-55.9175531 55.97502386 -56.8973724 56.9502828 -57.87695312 57.92578125 C-60.24902313 60.28616618 -62.6234086 62.64416905 -65 65 C-64.0919838 66.13199353 -63.17316174 67.25532363 -62.25 68.375 C-61.73953125 69.00148438 -61.2290625 69.62796875 -60.703125 70.2734375 C-58.91800519 72.08312318 -57.32050356 73.00117455 -55 74 C-52.8092214 71.83656815 -50.62237594 69.66938036 -48.4375 67.5 C-47.82841797 66.89929688 -47.21933594 66.29859375 -46.59179688 65.6796875 C-42.82962002 61.93741634 -39.2847879 58.07555033 -35.81518555 54.06201172 C-32.55830568 50.36226628 -29.13736797 46.83155402 -25.6875 43.3125 C-24.99205078 42.57966797 -24.29660156 41.84683594 -23.58007812 41.09179688 C-17.4421056 34.85255625 -10.05973672 29.46460188 -1 29 C0 30 0 30 0.09765625 32.72265625 C0.08025391 34.37587891 0.08025391 34.37587891 0.0625 36.0625 C0.05347656 37.16722656 0.04445312 38.27195313 0.03515625 39.41015625 C0.01775391 40.69212891 0.01775391 40.69212891 0 42 C-0.58265625 42.21011719 -1.1653125 42.42023438 -1.765625 42.63671875 C-8.0572088 45.29778171 -12.05403998 48.8014547 -16.52539062 53.91357422 C-22.31638017 60.49638555 -28.53490419 66.63424094 -34.75 72.8125 C-35.85830654 73.91635138 -36.96654354 75.02027259 -38.07470703 76.12426758 C-40.71390478 78.75210067 -43.35607558 81.37692166 -46 84 C-45.59007812 84.45890625 -45.18015625 84.9178125 -44.7578125 85.390625 C-44.21898437 86.00421875 -43.68015625 86.6178125 -43.125 87.25 C-42.32449219 88.15492188 -42.32449219 88.15492188 -41.5078125 89.078125 C-40.0202513 90.97418746 -38.99677564 92.81290005 -38 95 C-37.34 95 -36.68 95 -36 95 C-34.71069336 96.31054687 -34.71069336 96.31054687 -33.15234375 98.21875 C-27.96677695 104.31720242 -22.24072203 109.8661587 -16.5625 115.5 C-15.4379167 116.61955632 -14.31356595 117.73934629 -13.18945312 118.859375 C-10.46230656 121.57561534 -7.73204093 124.28868292 -5 127 C-5.33 127.99 -5.66 128.98 -6 130 C-7.89551022 130.05441656 -9.7914792 130.09298035 -11.6875 130.125 C-12.74324219 130.14820313 -13.79898438 130.17140625 -14.88671875 130.1953125 C-20.77237642 129.82607425 -23.87165636 127.50372606 -27.97387695 123.3984375 C-28.44277847 122.93318665 -28.91167999 122.46793579 -29.39479065 121.98858643 C-30.93343126 120.45801307 -32.4610037 118.91690563 -33.98828125 117.375 C-35.05679573 116.30596667 -36.1258292 115.23745185 -37.19535828 114.16943359 C-39.43000215 111.93470018 -41.65940226 109.69490409 -43.88500977 107.45117188 C-46.7426784 104.57074801 -49.6113624 101.70160235 -52.4837923 98.83590698 C-54.68971428 96.63331931 -56.8906324 94.42578811 -59.08995628 92.21661377 C-60.14641739 91.15629622 -61.20423911 90.09733256 -62.26342201 89.03973389 C-63.73831317 87.565212 -65.20655949 86.08438803 -66.6730957 84.6015625 C-67.92954643 83.33820068 -67.92954643 83.33820068 -69.21138 82.04931641 C-71 80 -71 80 -71 78 C-71.66 78 -72.32 78 -73 78 C-73.33 77.34 -73.66 76.68 -74 76 C-77.04893116 77.12923376 -78.64541574 78.6343658 -80.625 81.125 C-81.40875 82.07375 -82.1925 83.0225 -83 84 C-83.66 84 -84.32 84 -85 84 C-84.42801932 87.7186689 -82.96050383 89.39711974 -80.30639648 92.00244141 C-79.52566269 92.77649323 -78.74492889 93.55054504 -77.9405365 94.34805298 C-77.09262039 95.17421112 -76.24470428 96.00036926 -75.37109375 96.8515625 C-74.50686295 97.70680511 -73.64263214 98.56204773 -72.75221252 99.44320679 C-69.98765869 102.17769162 -67.21344504 104.90208321 -64.4375 107.625 C-61.65887618 110.35591904 -58.88249512 113.08897371 -56.11207581 115.82821655 C-54.3865698 117.53384473 -52.65614322 119.23451123 -50.92051697 120.92984009 C-50.14293533 121.69758759 -49.3653537 122.46533508 -48.56420898 123.25634766 C-47.87439438 123.93267242 -47.18457977 124.60899719 -46.47386169 125.30581665 C-45 127 -45 127 -45 129 C-47.74154336 130.37077168 -50.0646688 130.35798927 -53.125 130.5 C-54.22070312 130.5721875 -55.31640625 130.644375 -56.4453125 130.71875 C-61.72517634 129.65117314 -64.25387605 126.74152653 -68 123 C-69.02320617 121.995204 -70.04683744 120.99084078 -71.07080078 119.98681641 C-74.57187278 116.53643369 -78.03676921 113.0507924 -81.5 109.5625 C-82.71591114 108.3415631 -83.93205516 107.12085808 -85.1484375 105.90039062 C-88.10164966 102.93625987 -91.05169398 99.96901042 -94 97 C-96.89624617 98.30904433 -98.93947345 99.698995 -101.16040039 101.96508789 C-101.75103775 102.5623317 -102.34167511 103.1595755 -102.95021057 103.7749176 C-103.88944618 104.73904823 -103.88944618 104.73904823 -104.84765625 105.72265625 C-105.50076279 106.38333603 -106.15386932 107.04401581 -106.82676697 107.72471619 C-108.91021662 109.83257281 -110.98709868 111.94672029 -113.0625 114.0625 C-115.79767523 116.85075475 -118.53930548 119.63241864 -121.28515625 122.41015625 C-122.22742821 123.37732323 -122.22742821 123.37732323 -123.18873596 124.36402893 C-123.77622116 124.95812057 -124.36370636 125.55221222 -124.96899414 126.16430664 C-125.48321426 126.6890004 -125.99743439 127.21369415 -126.52723694 127.75428772 C-129.85946035 130.57279378 -133.55127253 130.10345275 -137.6875 130.0625 C-138.86699219 130.05347656 -140.04648438 130.04445312 -141.26171875 130.03515625 C-142.16535156 130.02355469 -143.06898438 130.01195312 -144 130 C-144 126 -144 126 -142.45874023 124.02050781 C-141.74919189 123.33827148 -141.03964355 122.65603516 -140.30859375 121.953125 C-139.52806641 121.19 -138.74753906 120.426875 -137.94335938 119.640625 C-136.70295898 118.45726562 -136.70295898 118.45726562 -135.4375 117.25 C-133.82959856 115.69522021 -132.22410156 114.13794974 -130.62109375 112.578125 C-129.9036499 111.89137695 -129.18620605 111.20462891 -128.44702148 110.49707031 C-126.49792159 108.50810556 -124.69049178 106.499078 -122.88110352 104.38769531 C-118.72927052 99.60269206 -114.26692447 95.15307191 -109.76963806 90.69447327 C-108.24406023 89.18187668 -106.72181914 87.66598798 -105.20031738 86.14929199 C-101.42383018 82.38604199 -97.64186489 78.62831332 -93.86004639 74.87042236 C-90.65240132 71.68264332 -87.44690705 68.49272958 -84.24412537 65.30006409 C-82.75796311 63.82029444 -81.26878004 62.34361435 -79.77941895 60.86706543 C-75.24394885 56.34791786 -70.85644283 51.7853671 -66.6892395 46.92523193 C-63.53495447 43.33028269 -60.1564649 39.95269395 -56.79296875 36.5546875 C-56.0275325 35.7811795 -55.26209625 35.00767151 -54.47346497 34.21072388 C-52.86390751 32.58742808 -51.25285756 30.96561089 -49.64038086 29.34521484 C-48.00599717 27.69928132 -46.37609743 26.04888308 -44.75073242 24.39404297 C-42.37884386 21.97926441 -39.99377609 19.57821607 -37.60546875 17.1796875 C-36.89158493 16.44829559 -36.17770111 15.71690369 -35.44218445 14.96334839 C-26.70607465 6.26388636 -12.94229135 -3.23557284 0 0 Z" fill="var(--accent)" transform="translate(222,63)" />
      <path d="M0 0 C16.83357921 -1.20513124 16.83357921 -1.20513124 21.1875 2.5625 C22.45928906 4.04084501 23.72987716 5.5202232 25 7 C34.6206007 17.64477393 44.69919645 27.82748293 54.875 37.9375 C56.25674924 39.31421347 57.63826063 40.6911657 59.01953125 42.06835938 C62.34363607 45.38164768 65.670882 48.69174918 69 52 C72.18086518 50.49053489 74.29869906 48.92058175 76.75 46.375 C77.83333333 45.25 78.91666667 44.125 80 43 C75.86736878 37.14322196 71.31907059 32.07098268 66.1953125 27.0703125 C65.4713327 26.35390594 64.74735291 25.63749939 64.00143433 24.89938354 C61.71412242 22.63629463 59.42040355 20.37987941 57.125 18.125 C54.08026588 15.13328364 51.04210664 12.13511251 48.0078125 9.1328125 C47.30480011 8.44639679 46.60178772 7.75998108 45.87747192 7.05276489 C45.23615326 6.41805267 44.59483459 5.78334045 43.93408203 5.12939453 C43.08186569 4.29288864 43.08186569 4.29288864 42.21243286 3.43948364 C41 2 41 2 41 0 C47.44011073 -1.1188859 54.30534294 -2.13720312 60.19805908 1.27148438 C65.55945767 5.42332465 70.03341293 10.4814434 74.5625 15.5 C75.97443171 16.99735107 77.39042394 18.49088417 78.81054688 19.98046875 C82.25546146 23.6112827 85.64120992 27.28944582 89 31 C91.85132497 29.71701366 93.77802733 28.43492687 95.86230469 26.11083984 C96.3909613 25.5303891 96.91961792 24.94993835 97.46429443 24.35189819 C98.02779602 23.72788116 98.59129761 23.10386414 99.171875 22.4609375 C100.40528885 21.14371046 101.64104567 19.82867412 102.87890625 18.515625 C104.8161305 16.45564304 106.73789949 14.38853616 108.62255859 12.28027344 C119.70277703 -0.06084765 119.70277703 -0.06084765 126.52148438 -0.89746094 C130.43007481 -1.03884997 134.14984661 -0.65649238 138 0 C138 3 138 3 135.54077148 5.78393555 C134.40834327 6.90909272 133.26782793 8.02614545 132.12109375 9.13671875 C131.21376244 10.03412529 131.21376244 10.03412529 130.2881012 10.94966125 C128.34484231 12.86947259 126.39177735 14.77891143 124.4375 16.6875 C121.8907648 19.18759989 119.34830157 21.69198132 116.80859375 24.19921875 C115.8847438 25.11004715 115.8847438 25.11004715 114.94223022 26.03927612 C111.41325954 29.53732839 108.07444297 33.1156246 104.86352539 36.90942383 C99.62539235 42.78576776 93.84899234 48.19616343 88.25195312 53.72753906 C82.59024853 59.32874175 76.98557437 64.88848467 71.8203125 70.95703125 C67.13571179 76.21464106 61.98166877 81.06500537 56.97021484 86.00927734 C51.66887427 91.24594667 46.4460101 96.48851239 41.59667969 102.15429688 C31.48690164 113.8408293 18.97225052 127.28773104 3 130 C-0.70783319 130.2078707 -4.28042086 130.14124984 -8 130 C-8 125.71 -8 121.42 -8 117 C-6.22625 116.773125 -4.4525 116.54625 -2.625 116.3125 C8.97265204 114.3477213 17.41296071 108.5558559 24.8828125 99.625 C30.46577541 93.18814597 36.63268558 87.29995852 42.6875 81.3125 C45.11101846 78.91570802 47.53110611 76.51552565 49.94921875 74.11328125 C50.49720627 73.57359207 51.04519379 73.03390289 51.60978699 72.4778595 C54.63701451 69.46994875 57.39932605 66.39618343 60 63 C58.90653119 61.65787938 57.7998425 60.32652025 56.6875 59 C56.07261719 58.2575 55.45773438 57.515 54.82421875 56.75 C53.06049937 54.65386277 53.06049937 54.65386277 50 55 C48.29191471 56.27092723 48.29191471 56.27092723 46.61767578 58.04174805 C45.95333527 58.70631516 45.28899475 59.37088226 44.60452271 60.05558777 C43.89198334 60.78361099 43.17944397 61.51163422 42.4453125 62.26171875 C41.70675018 63.00452591 40.96818787 63.74733307 40.20724487 64.51264954 C37.83938378 66.89733621 35.48212333 69.29220366 33.125 71.6875 C31.54365918 73.28388734 29.96163595 74.87959902 28.37890625 76.47460938 C25.46204317 79.41598828 22.54919035 82.36121409 19.64111328 85.3112793 C18.42748952 86.54093249 17.21379273 87.7705136 16 89 C15.49634918 89.51143051 14.99269836 90.02286102 14.4737854 90.54978943 C9.10075388 95.97520939 3.55301639 99.40224653 -4 101 C-5.32 101 -6.64 101 -8 101 C-8 96.71 -8 92.42 -8 88 C-6.68 87.484375 -5.36 86.96875 -4 86.4375 C4.95202302 82.94061601 11.8058178 74.35177032 18.4375 67.6875 C19.25154297 66.87732422 20.06558594 66.06714844 20.90429688 65.23242188 C21.67708984 64.45833984 22.44988281 63.68425781 23.24609375 62.88671875 C23.94404053 62.18764404 24.6419873 61.48856934 25.36108398 60.76831055 C27.07362678 59.08607832 27.07362678 59.08607832 28 57 C28.66 57 29.32 57 30 57 C30.2475 56.42765625 30.495 55.8553125 30.75 55.265625 C32.19316199 52.64989389 33.88216222 50.85226544 36 48.75 C37.051875 47.69039062 37.051875 47.69039062 38.125 46.609375 C40 45 40 45 42 45 C37.1322868 39.27599595 32.01354997 33.90228286 26.66015625 28.6328125 C25.08776325 27.07304506 23.51550129 25.51314552 21.94335938 23.953125 C19.4871288 21.52186969 17.0293121 19.09225729 14.5690918 16.66503906 C12.17847165 14.30443461 9.79395526 11.93780197 7.41015625 9.5703125 C6.29472191 8.4750676 6.29472191 8.4750676 5.15675354 7.35769653 C4.47862106 6.68294281 3.80048859 6.00818909 3.10180664 5.31298828 C2.50114883 4.7197879 1.90049103 4.12658752 1.28163147 3.51541138 C0 2 0 2 0 0 Z" fill="var(--accent)" transform="translate(44,62)" />
      <path d="M0 0 C0 3 0 3 -1.6953125 4.76953125 C-2.49710937 5.44371094 -3.29890625 6.11789063 -4.125 6.8125 C-8.64379325 10.74635699 -12.95186814 14.82516252 -17.1875 19.0625 C-17.75678223 19.62751221 -18.32606445 20.19252441 -18.91259766 20.7746582 C-21.77466795 23.64539643 -24.51400691 26.56775513 -27.14453125 29.65234375 C-32.78016246 36.16753793 -39.05037198 42.10484134 -45.17529297 48.15478516 C-53.6491115 56.51657206 -53.6491115 56.51657206 -61.57250977 65.39648438 C-63.81431166 67.91472533 -66.34611106 69.92867205 -69 72 C-69.66 71.67 -70.32 71.34 -71 71 C-70.2793335 70.28457031 -69.55866699 69.56914062 -68.81616211 68.83203125 C-66.10927088 66.14342116 -63.40583901 63.45135438 -60.70336914 60.75830078 C-59.53957726 59.59949681 -58.37488451 58.44159678 -57.20922852 57.28466797 C-55.52114356 55.60889423 -53.83646862 53.92975246 -52.15234375 52.25 C-51.64162827 51.7444458 -51.13091278 51.2388916 -50.60472107 50.71801758 C-47.83576984 47.94948465 -45.2014011 45.11155331 -42.64379883 42.14599609 C-38.79918279 37.70877659 -34.70267359 33.55852247 -30.546875 29.4140625 C-29.37381805 28.23957047 -29.37381805 28.23957047 -28.17706299 27.04135132 C-26.53788958 25.4015021 -24.89747152 23.76289614 -23.25585938 22.12548828 C-20.73972 19.61474203 -18.22900963 17.09865464 -15.71875 14.58203125 C-14.12011252 12.98405395 -12.5211652 11.38638655 -10.921875 9.7890625 C-10.17186218 9.03702545 -9.42184937 8.2849884 -8.64910889 7.51016235 C-7.95118225 6.81538788 -7.25325562 6.1206134 -6.53417969 5.40478516 C-5.92241882 4.79381989 -5.31065796 4.18285461 -4.68035889 3.55337524 C-3 2 -3 2 0 0 Z" fill="var(--accent)" transform="translate(196,70)" />
      <path d="M0 0 C4.89596076 0.87938433 7.18728037 4.12102894 10.375 7.6875 C18.66126967 16.73788909 27.30830439 25.40385994 36 34.0625 C37.03432159 35.09375504 37.03432159 35.09375504 38.08953857 36.14584351 C42.05636682 40.100581 46.02662197 44.0518436 50 48 C53.18086518 46.49053489 55.29869906 44.92058175 57.75 42.375 C58.36359375 41.74335937 58.9771875 41.11171875 59.609375 40.4609375 C60.06828125 39.97882813 60.5271875 39.49671875 61 39 C61.99 39.495 61.99 39.495 63 40 C60.66666667 42.33333333 58.33333333 44.66666667 56 47 C55.4740625 47.556875 54.948125 48.11375 54.40625 48.6875 C52.68834979 50.29087353 51.28667114 50.60574636 49 51 C49 50.34 49 49.68 49 49 C48.01 48.67 47.02 48.34 46 48 C44.3125 46.5625 44.3125 46.5625 43 45 C43 44.34 43 43.68 43 43 C42.01 42.67 41.02 42.34 40 42 C38.60205078 40.58081055 38.60205078 40.58081055 37.0703125 38.69921875 C32.01210881 32.73861876 26.42010119 27.31324707 20.875 21.8125 C19.79273291 20.73526293 18.71070014 19.65779039 17.62890625 18.58007812 C15.64059746 16.59985746 13.65070634 14.62127988 11.65966797 12.64379883 C10.78197754 11.77134521 9.90428711 10.8988916 9 10 C8.10941895 9.12045654 7.21883789 8.24091309 6.30126953 7.3347168 C4.00997092 5.01011584 1.99238669 2.58272349 0 0 Z" fill="var(--accent)" transform="translate(63,66)" />
      <path d="M0 0 C6.48556238 -1.16968577 13.31670283 -2.1590738 19.23907471 1.3125 C24.7553619 5.61461583 29.38069811 10.82968584 34.0625 16 C35.52261589 17.54552838 36.98678425 19.08723881 38.45507812 20.625 C42.01834745 24.37423297 45.52265806 28.17100959 49 32 C48.505 32.99 48.505 32.99 48 34 C47.14470703 33.06091797 46.28941406 32.12183594 45.40820312 31.15429688 C42.19264663 27.64689306 38.92254439 24.19457994 35.63427734 20.75537109 C34.22488651 19.26601482 32.83024186 17.76254759 31.45166016 16.24462891 C23.40094543 6.75163618 23.40094543 6.75163618 12.3984375 2.03125 C8.50230618 1.88049613 4.82680064 2.28583453 1 3 C0.67 2.01 0.34 1.02 0 0 Z" fill="var(--accent)" transform="translate(85,62)" />
      <path d="M0 0 C4.10108886 1.62156024 6.83148167 4.5767703 9.859375 7.6640625 C10.40861633 8.21613373 10.95785767 8.76820496 11.52374268 9.33700562 C13.27059293 11.09501815 15.01034601 12.8598689 16.75 14.625 C17.93573591 15.8207708 19.1219288 17.01608865 20.30859375 18.2109375 C23.21105085 21.13540253 26.1071641 24.06601874 29 27 C28.34 27.66 27.68 28.32 27 29 C27 28.34 27 27.68 27 27 C26.01 26.67 25.02 26.34 24 26 C22.82295269 24.58754323 21.65053022 23.17084048 20.5078125 21.73046875 C18.86390277 19.84380552 17.1018848 18.29783545 15.1875 16.6875 C11.31735894 13.40374395 8.04198448 9.78375859 4.76171875 5.91796875 C2.95463947 3.79820274 2.95463947 3.79820274 0 2 C0 1.34 0 0.68 0 0 Z" fill="var(--accent)" transform="translate(135,150)" />
      <path d="M0 0 C0.33 0.99 0.66 1.98 1 3 C-1.5709814 5.65808032 -4.15875481 8.29918202 -6.75 10.9375 C-7.47960937 11.69224609 -8.20921875 12.44699219 -8.9609375 13.22460938 C-10.02441406 14.30258789 -10.02441406 14.30258789 -11.109375 15.40234375 C-11.75874023 16.06741943 -12.40810547 16.73249512 -13.07714844 17.41772461 C-15.09495833 19.07813928 -16.44587004 19.59998548 -19 20 C-19 19.34 -19 18.68 -19 18 C-19.99 18 -20.98 18 -22 18 C-27 12.65116279 -27 12.65116279 -27 10 C-23.18315774 11.55500981 -20.80804268 14.03595495 -18 17 C-13.74327859 15.34460834 -11.00257093 12.26236271 -7.875 9.0625 C-7.33746094 8.52431641 -6.79992187 7.98613281 -6.24609375 7.43164062 C-3.89375758 5.05290666 -1.86088777 2.79133165 0 0 Z" fill="var(--accent)" transform="translate(183,120)" />
      <path d="M0 0 C5.28 0 10.56 0 16 0 C16 0.99 16 1.98 16 3 C10.39 2.67 4.78 2.34 -1 2 C-0.67 1.34 -0.34 0.68 0 0 Z" fill="var(--accent)" transform="translate(166,62)" />
      <path d="M0 0 C3.81684226 1.55500981 6.19195732 4.03595495 9 7 C8.67 7.99 8.34 8.98 8 10 C8 9.34 8 8.68 8 8 C7.01 8 6.02 8 5 8 C0 2.65116279 0 2.65116279 0 0 Z" fill="var(--accent)" transform="translate(156,130)" />
    </svg>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ width: '100vw', height: '100vh', background: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="xf-loader"><span /><span /><span /></div></div>}>
      <ChatContent />
    </Suspense>
  );
}

function ChatContent() {
  const router = useRouter();
  const {
    user, loading, minLoading, theme, toggleTheme, changeTheme, scrolled, mobileMenuOpen, setMobileMenuOpen,
    searchOpen, setSearchOpen, searchQuery, setSearchQuery, filteredSearch,
    authModalOpen, setAuthModalOpen, authTab, setAuthTab, authMessage, openAuthModal,
    loginEmail, setLoginEmail, loginPassword, setLoginPassword, loginLoading, handleLogin,
    signupName, setSignupName, signupEmail, setSignupEmail, signupPassword, setSignupPassword, signupConfirmPassword, setSignupConfirmPassword,
    signupPhone, setSignupPhone, signupCompany, setSignupCompany, signupLoading, handleSignup,
    handleLogout, getPasswordStrength,
    dashboardOpen, setDashboardOpen,
    forgotStep, setForgotStep, forgotEmail, setForgotEmail, forgotLoading, handleForgotSubmit,
    resetCode, setResetCode, newPassword, setNewPassword, resetLoading, handleResetSubmit,
    verificationStep, setVerificationStep, verificationEmail, verificationCode, setVerificationCode,
    verificationLoading, handleVerifyEmail, handleResendVerification, resendLoading,
    notifOpen, setNotifOpen, notifications, unreadCount, loadNotifications, setNotifications, setUnreadCount,
    profileName, setProfileName, profileUsername, setProfileUsername, profilePhone, setProfilePhone, profileCompany, setProfileCompany,
    profileSaving, avatarUploading, handleAvatarUpload, handleAvatarUploaded, handleProfileSave,
    scrollToSection,
  } = usePageFeatures();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; size: number } | null>(null);
  const [uploading, setUploading] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {  }
  }, []);

  const loadMessages = useCallback(async (convId: string) => {
    try {
      const res = await fetch('/api/ai/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId: convId }),
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setActiveConvId(convId);
        setSidebarOpen(false);
      }
    } catch {  }
  }, []);

  const deleteConversation = useCallback(async (convId: string) => {
    try {
      const res = await fetch(`/api/ai/conversations?id=${convId}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeConvId === convId) {
          setActiveConvId(null);
          setMessages([]);
        }
        loadConversations();
      }
    } catch {  }
  }, [activeConvId, loadConversations]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/ai/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setAttachedFile({ name: data.fileName, content: data.content, size: data.fileSize });
        inputRef.current?.focus();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to process file');
      }
    } catch {
      alert('Failed to upload file');
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const typingRef = useRef<NodeJS.Timeout | null>(null);

  const startTyping = useCallback((msgId: string, fullText: string) => {
    if (typingRef.current) clearInterval(typingRef.current);

    let pos = 0;
    const words = fullText.split(/(\s+)/);
    let accumulated = '';

    const firstChunk = words.slice(0, 3).join('');
    accumulated = firstChunk;
    pos = 3;

    setMessages(prev => prev.map(m =>
      m.id === msgId ? { ...m, content: accumulated, isStreaming: true } : m
    ));

    typingRef.current = setInterval(() => {
      if (pos >= words.length) {
        clearInterval(typingRef.current!);
        typingRef.current = null;
        setMessages(prev => prev.map(m =>
          m.id === msgId ? { ...m, content: fullText, isStreaming: false } : m
        ));
        return;
      }

      const chunk = words.slice(pos, pos + 2).join('');
      pos += 2;
      accumulated += chunk;

      setMessages(prev => prev.map(m =>
        m.id === msgId ? { ...m, content: accumulated } : m
      ));

      if (messagesAreaRef.current) {
        messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
      }
    }, 25);
  }, []);

  useEffect(() => {
    return () => {
      if (typingRef.current) clearInterval(typingRef.current);
    };
  }, []);

  const sendMessage = useCallback(async () => {
    if ((!input.trim() && !attachedFile) || sending) return;
    const userMsg = input.trim() || (attachedFile ? 'Explain this file to me' : '');
    const fileData = attachedFile;
    setInput('');
    setAttachedFile(null);
    setSending(true);

    if (inputRef.current) inputRef.current.style.height = 'auto';

    const displayMsg = fileData ? `📄 ${fileData.name}\n${userMsg}` : userMsg;

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: displayMsg,
      createdAt: new Date().toISOString(),
    };

    const streamMsgId = `stream-${Date.now()}`;
    const streamMsg: ChatMessage = {
      id: streamMsgId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, tempUserMsg, streamMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: activeConvId,
          message: userMsg,
          fileContent: fileData?.content,
          fileName: fileData?.name,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        startTyping(streamMsgId, data.reply);

        if (!activeConvId) {
          setActiveConvId(data.conversationId);
          loadConversations();
        }
      } else {
        let errorMsg = 'Failed to get response';
        try {
          const errData = await res.json();
          errorMsg = errData.error || errorMsg;
        } catch {  }
        setMessages(prev => prev.map(m =>
          m.id === streamMsgId ? { ...m, content: `⚠️ Error: ${errorMsg}`, isStreaming: false } : m
        ));
      }
    } catch {
      setMessages(prev => prev.map(m =>
        m.id === streamMsgId ? { ...m, content: '⚠️ Network error. Please try again.', isStreaming: false } : m
      ));
    }
    setSending(false);
  }, [input, sending, activeConvId, loadConversations, attachedFile, startTyping]);

  useEffect(() => {
    if (messagesAreaRef.current) {
      messagesAreaRef.current.scrollTop = messagesAreaRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (user) loadConversations();
  }, [user, loadConversations]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 150) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const renderContent = (content: string) => {
    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            if (match || codeString.includes('\n')) {
              return (
                <pre className="ai-code-block">
                  {match && <div className="ai-code-lang">{match[1]}</div>}
                  <code>{codeString}</code>
                </pre>
              );
            }
            return <code className="ai-inline-code" {...props}>{codeString}</code>;
          },
          h1({ children }) { return <h1 className="md-h1">{children}</h1>; },
          h2({ children }) { return <h2 className="md-h2">{children}</h2>; },
          h3({ children }) { return <h3 className="md-h3">{children}</h3>; },
          h4({ children }) { return <h4 className="md-h4">{children}</h4>; },
          p({ children }) { return <p className="md-p">{children}</p>; },
          a({ href, children }) { return <a className="md-link" href={href} target="_blank" rel="noopener noreferrer">{children}</a>; },
          ul({ children }) { return <ul className="md-ul">{children}</ul>; },
          ol({ children }) { return <ol className="md-ol">{children}</ol>; },
          li({ children }) { return <li className="md-li">{children}</li>; },
          blockquote({ children }) { return <blockquote className="md-blockquote">{children}</blockquote>; },
          hr() { return <hr className="md-hr" />; },
          table({ children }) { return <div className="md-table-wrap"><table className="md-table">{children}</table></div>; },
          th({ children }) { return <th className="md-th">{children}</th>; },
          td({ children }) { return <td className="md-td">{children}</td>; },
          strong({ children }) { return <strong className="md-strong">{children}</strong>; },
          em({ children }) { return <em className="md-em">{children}</em>; },
        }}
      >
        {content}
      </ReactMarkdown>
    );
  };

  return (
    <>
      <title>XF AI | Chat</title>
      <meta name="description" content="Chat with XF AI — your intelligent assistant for coding, learning, and tech career advice." />


      <AuthGate loading={loading} minLoading={minLoading} user={user} onSignIn={() => openAuthModal('signin', 'Sign in to chat with XF AI')} onSignUp={() => openAuthModal('signup')} />

          <div className="zai-chat-page" data-lenis-prevent style={{ opacity: (loading || minLoading) ? 0 : 1, pointerEvents: (loading || minLoading) ? 'none' : 'auto', transition: 'opacity 0.3s ease' }}>
            <div className="zai-bg-orb zai-bg-orb-1" />
            <div className="zai-bg-orb zai-bg-orb-2" />

            <div className={`zai-chat-sidebar${sidebarOpen ? ' open' : ''}`}>
              <div className="zai-sidebar-header">
                <button className="zai-new-chat-btn" onClick={() => { setActiveConvId(null); setMessages([]); setSidebarOpen(false); }}>
                  <i className="fa-solid fa-plus" />
                  <span>New Chat</span>
                </button>
                <button className="zai-sidebar-collapse" onClick={() => setSidebarOpen(false)}>
                  <i className="fa-solid fa-chevron-left" />
                </button>
              </div>
              <div className="zai-sidebar-conversations">
                {conversations.length === 0 && (
                  <div className="zai-sidebar-empty">
                    <i className="fa-regular fa-comment-dots" style={{ fontSize: 20, opacity: 0.3, marginBottom: 8, display: 'block' }} />
                    No conversations yet
                  </div>
                )}
                {conversations.map(conv => (
                  <div
                    key={conv.id}
                    className={`zai-conv-item${activeConvId === conv.id ? ' active' : ''}`}
                    onClick={() => loadMessages(conv.id)}
                  >
                    <i className="fa-regular fa-message" />
                    <span className="zai-conv-title">{conv.title}</span>
                    <button
                      className="zai-conv-delete"
                      onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {sidebarOpen && (
              <div className="zai-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
            )}

            <div className="zai-chat-main">
              <div className="zai-chat-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className="zai-sidebar-open-btn" onClick={() => setSidebarOpen(true)}>
                    <i className="fa-solid fa-bars" />
                  </button>
                  <a href="/" className="zai-home-link" title="Back to home">
                    <i className="fa-solid fa-arrow-left" />
                  </a>
                </div>
                <div className="zai-header-center">
                  <ChatLogo size={28} />
                </div>

              </div>

              <div className="zai-messages-area" ref={messagesAreaRef}>
                {messages.length === 0 ? (
                  <div className="zai-empty-state">
                    <div className="zai-empty-orb">
                      <ChatLogo size={64} />
                      <div className="zai-empty-orb-ring" />
                    </div>
                    <h2 className="zai-empty-title">
                      What can I help with?
                    </h2>
                    <p className="zai-empty-sub">Code, debug, learn, brainstorm — start a conversation below</p>

                    <div className="zai-suggestions-grid">
                      {SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          className="zai-suggest-card"
                          onClick={() => { setInput(s.desc); inputRef.current?.focus(); }}
                        >
                          <i className={s.icon} />
                          <div>
                            <div className="zai-suggest-label">{s.label}</div>
                            <div className="zai-suggest-desc">{s.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="zai-messages-list">
                    {messages.map(msg => (
                      <div key={msg.id} className={`zai-msg ${msg.role}`}>
                        {msg.role === 'assistant' && (
                          <ChatLogo size={24} />
                        )}
                        <div className={`zai-msg-content${msg.isStreaming ? ' streaming' : ''}`}>
                          {msg.role === 'assistant' ? (
                            msg.content ? renderContent(msg.content) : (
                              <span className="zai-cursor-blink">▍</span>
                            )
                          ) : msg.content}
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              <div className="zai-input-wrapper">
                <div className="zai-input-container">
                  {attachedFile && (
                    <div className="zai-file-chip">
                      <i className="fa-solid fa-file-lines" />
                      <span className="zai-file-chip-name">{attachedFile.name}</span>
                      <span className="zai-file-chip-size">{(attachedFile.size / 1024).toFixed(0)}KB</span>
                      <button className="zai-file-chip-x" onClick={removeAttachedFile}>
                        <i className="fa-solid fa-xmark" />
                      </button>
                    </div>
                  )}
                  <div className="zai-input-bar">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.csv,.md"
                      style={{ display: 'none' }}
                      onChange={handleFileSelect}
                    />
                    <button
                      className="zai-attach-btn"
                      aria-label="Attach file"
                      title="Attach PDF, TXT, CSV, or MD"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <i className="fa-solid fa-spinner fa-spin" />
                      ) : (
                        <i className="fa-solid fa-paperclip" />
                      )}
                    </button>
                    <textarea
                      ref={inputRef}
                      className="zai-textarea"
                      placeholder="Message XF AI..."
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      rows={1}
                      disabled={sending}
                    />
                    <button
                      className="zai-send-btn"
                      onClick={sendMessage}
                      disabled={(!input.trim() && !attachedFile) || sending}
                      aria-label="Send message"
                    >
                      <i className="fa-solid fa-arrow-up" />
                    </button>
                  </div>
                </div>
                <p className="zai-input-disclaimer">XF AI can make mistakes. Consider checking important info.</p>
              </div>
            </div>
          </div>

      <style>{`
        .zai-chat-page {
          display: flex;
          height: 100vh;
          height: 100dvh;
          background: var(--black);
          color: var(--text-light);
          position: relative;
          overflow: hidden;
        }


        html, body {
          overflow: hidden !important;
          height: 100% !important;
          position: fixed !important;
          width: 100% !important;
        }

        .zai-bg-orb {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
          /* No filter:blur — radial-gradient already soft-fades. Saves a constant
             100px offscreen raster pass per composite frame on the chat page. */
          z-index: 0;
        }
        .zai-bg-orb-1 {
          width: 500px; height: 500px;
          top: -120px; right: -100px;
          background: radial-gradient(circle, color-mix(in srgb, var(--accent) 18%, transparent) 0%, transparent 75%);
          animation: zai-orb-float 20s ease-in-out infinite;
        }
        .zai-bg-orb-2 {
          width: 400px; height: 400px;
          bottom: -80px; left: -60px;
          background: radial-gradient(circle, color-mix(in srgb, var(--accent) 12%, transparent) 0%, transparent 75%);
          animation: zai-orb-float 24s ease-in-out infinite reverse;
        }
        @keyframes zai-orb-float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }

        .zai-chat-sidebar {
          width: 280px;
          min-width: 280px;
          background: color-mix(in srgb, var(--card-bg) 60%, transparent);
          backdrop-filter: blur(32px) saturate(1.5);
          -webkit-backdrop-filter: blur(32px) saturate(1.5);
          border-right: 1px solid color-mix(in srgb, var(--accent) 6%, var(--border-color));
          display: flex;
          flex-direction: column;
          transition: margin-left 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.35s ease;
          z-index: 50;
          position: relative;
        }
        .zai-chat-sidebar:not(.open) {
          margin-left: -280px;
          opacity: 0;
          pointer-events: none;
        }
        .zai-sidebar-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 20px 16px;
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 6%, var(--border-color));
        }
        .zai-new-chat-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 16px;
          border-radius: 14px;
          background: var(--v-gradient);
          color: #fff;
          border: none;
          cursor: pointer;
          font-size: 0.84rem;
          font-weight: 700;
          font-family: 'Space Grotesk', sans-serif;
          transition: all 0.25s;
          box-shadow: 0 4px 20px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .zai-new-chat-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 28px color-mix(in srgb, var(--accent) 35%, transparent);
        }
        .zai-new-chat-btn:active {
          transform: translateY(0);
        }
        .zai-sidebar-collapse {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--text-light) 5%, transparent);
          border: 1px solid color-mix(in srgb, var(--border-color) 60%, transparent);
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.8rem;
        }
        .zai-sidebar-collapse:hover {
          color: var(--accent);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
          background: color-mix(in srgb, var(--accent) 8%, transparent);
        }
        .zai-sidebar-conversations {
          flex: 1;
          overflow-y: auto;
          padding: 10px 8px;
        }
        .zai-sidebar-conversations::-webkit-scrollbar {
          width: 4px;
        }
        .zai-sidebar-conversations::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--text-dim) 20%, transparent);
          border-radius: 4px;
        }
        .zai-sidebar-empty {
          color: var(--text-dim);
          font-size: 0.8rem;
          text-align: center;
          padding: 40px 12px;
          font-family: 'Space Grotesk', sans-serif;
          opacity: 0.6;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .zai-conv-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 2px;
          position: relative;
        }
        .zai-conv-item:hover {
          background: color-mix(in srgb, var(--accent) 6%, transparent);
        }
        .zai-conv-item.active {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 15%, transparent);
        }
        .zai-conv-item > i {
          font-size: 12px;
          color: var(--text-dim);
          flex-shrink: 0;
        }
        .zai-conv-item.active > i {
          color: var(--accent);
        }
        .zai-conv-title {
          flex: 1;
          font-size: 0.82rem;
          font-family: 'Space Grotesk', sans-serif;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: var(--text-light);
        }
        .zai-conv-delete {
          opacity: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 10px;
          transition: all 0.15s;
          flex-shrink: 0;
        }
        .zai-conv-item:hover .zai-conv-delete {
          opacity: 1;
        }
        .zai-conv-delete:hover {
          color: #ef4444;
          background: color-mix(in srgb, #ef4444 10%, transparent);
        }


        .zai-sidebar-overlay {
          display: none;
        }

        .zai-chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
          position: relative;
          z-index: 1;
        }

        .zai-chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 12px 20px;
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 6%, var(--border-color));
          background: color-mix(in srgb, var(--card-bg) 20%, transparent);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          min-height: 56px;
          position: relative;
          z-index: 5;
        }
        .zai-sidebar-open-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--text-light) 5%, transparent);
          border: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.95rem;
        }
        .zai-sidebar-open-btn:hover {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
          color: var(--accent);
        }
        .zai-home-link {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          border-radius: 12px;
          background: color-mix(in srgb, var(--text-light) 5%, transparent);
          border: 1px solid color-mix(in srgb, var(--border-color) 50%, transparent);
          color: var(--text-dim);
          transition: all 0.2s;
          font-size: 0.9rem;
          text-decoration: none;
        }
        .zai-home-link:hover {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          border-color: color-mix(in srgb, var(--accent) 30%, transparent);
          color: var(--accent);
        }
        .zai-header-center {
          display: flex;
          align-items: center;
          gap: 10px;
        }


        .zai-model-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.65rem;
          font-weight: 600;
          font-family: 'Space Grotesk', sans-serif;
          padding: 5px 12px;
          border-radius: 20px;
          background: color-mix(in srgb, var(--accent) 6%, transparent);
          color: var(--accent);
          letter-spacing: 0.3px;
          border: 1px solid color-mix(in srgb, var(--accent) 12%, transparent);
        }


        .zai-messages-area {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
        }
        .zai-messages-area::-webkit-scrollbar {
          width: 6px;
        }
        .zai-messages-area::-webkit-scrollbar-thumb {
          background: color-mix(in srgb, var(--text-dim) 15%, transparent);
          border-radius: 6px;
        }

        .zai-empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          text-align: center;
          padding: 40px 24px 60px;
          gap: 6px;
        }

        .zai-empty-orb {
          position: relative;
          width: 100px;
          height: 100px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .zai-empty-orb-inner {
          background: transparent;
        }
        .zai-empty-orb-ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          border: 1.5px solid color-mix(in srgb, var(--accent) 20%, transparent);
          animation: zai-ring-spin 8s linear infinite;
        }
        .zai-empty-orb-ring::before {
          content: '';
          position: absolute;
          top: -2px;
          left: 50%;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 10px var(--accent);
          transform: translateX(-50%);
        }
        @keyframes zai-ring-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .zai-empty-title {
          font-family: 'Inter Tight', sans-serif;
          font-size: clamp(1.5rem, 3vw, 2rem);
          font-weight: 800;
          color: var(--text-light);
          margin: 0 0 4px;
          letter-spacing: -0.03em;
        }
        .zai-empty-sub {
          color: var(--text-dim);
          font-size: 0.92rem;
          font-family: 'Space Grotesk', sans-serif;
          margin: 0 0 32px;
          line-height: 1.5;
        }

        .zai-suggestions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
          max-width: 560px;
          width: 100%;
        }
        .zai-suggest-card {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px 18px;
          border-radius: 16px;
          background: color-mix(in srgb, var(--card-bg) 40%, transparent);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid color-mix(in srgb, var(--accent) 6%, var(--border-color));
          color: var(--text-dim);
          cursor: pointer;
          font-size: 0.82rem;
          font-family: 'Space Grotesk', sans-serif;
          transition: all 0.25s;
          text-align: left;
          line-height: 1.4;
        }
        .zai-suggest-card i {
          font-size: 1rem;
          margin-top: 2px;
          flex-shrink: 0;
          color: var(--accent);
          opacity: 0.6;
          transition: opacity 0.2s, transform 0.2s;
        }
        .zai-suggest-card:hover {
          color: var(--text-light);
          border-color: color-mix(in srgb, var(--accent) 25%, transparent);
          background: color-mix(in srgb, var(--accent) 5%, transparent);
          transform: translateY(-2px);
          box-shadow: 0 8px 24px color-mix(in srgb, var(--accent) 8%, transparent);
        }
        .zai-suggest-card:hover i {
          opacity: 1;
          transform: scale(1.1);
        }
        .zai-suggest-label {
          font-weight: 700;
          color: var(--text-light);
          font-size: 0.84rem;
          margin-bottom: 2px;
        }
        .zai-suggest-desc {
          font-size: 0.76rem;
          color: var(--text-dim);
          line-height: 1.35;
        }

        .zai-messages-list {
          padding: 28px 20px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          max-width: 780px;
          width: 100%;
          margin: 0 auto;
        }

        .zai-msg {
          display: flex;
          gap: 12px;
          max-width: 100%;
          animation: zai-msg-in 0.3s ease-out;
        }
        @keyframes zai-msg-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .zai-msg.user {
          justify-content: flex-end;
          padding-right: 4px;
        }
        .zai-msg-avatar {
          background: transparent;
        }
        .zai-msg-content {
          padding: 14px 20px;
          border-radius: 20px;
          font-size: 0.9rem;
          line-height: 1.7;
          font-family: 'Space Grotesk', sans-serif;
          max-width: 85%;
          word-break: break-word;
        }
        .zai-msg.user .zai-msg-content {
          background: var(--v-gradient);
          color: #fff;
          border-bottom-right-radius: 6px;
          box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 20%, transparent);
        }
        .zai-msg.assistant .zai-msg-content {
          background: color-mix(in srgb, var(--card-bg) 50%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 6%, var(--border-color));
          color: var(--text-light);
          border-bottom-left-radius: 6px;
        }

        .zai-msg-content.streaming {
          min-height: 24px;
        }
        .zai-cursor-blink {
          color: var(--accent);
          animation: cursor-pulse 0.8s ease-in-out infinite;
          font-size: 0.95rem;
        }
        @keyframes cursor-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        .ai-code-block {
          background: color-mix(in srgb, var(--black, #000) 70%, transparent);
          border: 1px solid color-mix(in srgb, var(--accent) 10%, var(--border-color));
          border-radius: 12px;
          padding: 16px 20px;
          margin: 10px 0;
          overflow-x: auto;
          font-size: 0.82rem;
          font-family: 'Sarasa Mono SC', 'Fira Code', monospace;
        }
        .ai-code-lang {
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: 600;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ai-inline-code {
          background: color-mix(in srgb, var(--accent) 10%, transparent);
          padding: 2px 7px;
          border-radius: 6px;
          font-family: 'Sarasa Mono SC', 'Fira Code', monospace;
          font-size: 0.84rem;
        }

        .zai-msg.assistant .zai-msg-content {
          line-height: 1.7;
        }
        .zai-msg.assistant .zai-msg-content > *:first-child {
          margin-top: 0 !important;
        }
        .zai-msg.assistant .zai-msg-content > *:last-child {
          margin-bottom: 0 !important;
        }
        .md-p {
          margin: 0 0 12px;
          line-height: 1.7;
        }
        .md-p:last-child {
          margin-bottom: 0;
        }
        .md-h1 {
          font-family: 'Inter Tight', sans-serif;
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-light);
          margin: 20px 0 10px;
          letter-spacing: -0.02em;
          line-height: 1.3;
        }
        .md-h2 {
          font-family: 'Inter Tight', sans-serif;
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-light);
          margin: 18px 0 8px;
          letter-spacing: -0.01em;
          line-height: 1.35;
        }
        .md-h3 {
          font-family: 'Inter Tight', sans-serif;
          font-size: 1.02rem;
          font-weight: 700;
          color: var(--text-light);
          margin: 16px 0 6px;
          line-height: 1.4;
        }
        .md-h4 {
          font-family: 'Inter Tight', sans-serif;
          font-size: 0.94rem;
          font-weight: 700;
          color: var(--text-light);
          margin: 14px 0 6px;
          line-height: 1.4;
        }
        .md-link {
          color: var(--accent);
          text-decoration: none;
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent);
          transition: all 0.2s;
        }
        .md-link:hover {
          color: var(--accent);
          border-bottom-color: var(--accent);
        }
        .md-strong {
          font-weight: 700;
          color: var(--text-light);
        }
        .md-em {
          font-style: italic;
        }
        .md-ul {
          margin: 0 0 12px;
          padding-left: 22px;
          list-style: none;
        }
        .md-ul > .md-li {
          position: relative;
          padding-left: 4px;
          margin-bottom: 6px;
          line-height: 1.65;
        }
        .md-ul > .md-li::before {
          content: '';
          position: absolute;
          left: -14px;
          top: 10px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          opacity: 0.6;
        }
        .md-ol {
          margin: 0 0 12px;
          padding-left: 24px;
          counter-reset: md-ol-counter;
          list-style: none;
        }
        .md-ol > .md-li {
          position: relative;
          padding-left: 4px;
          margin-bottom: 6px;
          line-height: 1.65;
          counter-increment: md-ol-counter;
        }
        .md-ol > .md-li::before {
          content: counter(md-ol-counter) '.';
          position: absolute;
          left: -22px;
          top: 0;
          font-weight: 700;
          font-size: 0.82rem;
          color: var(--accent);
          font-family: 'Space Grotesk', sans-serif;
        }
        .md-li > .md-ul,
        .md-li > .md-ol {
          margin-top: 6px;
          margin-bottom: 4px;
        }
        .md-blockquote {
          margin: 0 0 12px;
          padding: 10px 16px;
          border-left: 3px solid var(--accent);
          background: color-mix(in srgb, var(--accent) 5%, transparent);
          border-radius: 0 10px 10px 0;
          color: var(--text-dim);
          font-style: italic;
        }
        .md-blockquote .md-p {
          margin-bottom: 6px;
        }
        .md-blockquote .md-p:last-child {
          margin-bottom: 0;
        }
        .md-hr {
          border: none;
          height: 1px;
          background: color-mix(in srgb, var(--accent) 15%, var(--border-color));
          margin: 16px 0;
        }
        .md-table-wrap {
          overflow-x: auto;
          margin: 0 0 12px;
          border-radius: 10px;
          border: 1px solid color-mix(in srgb, var(--accent) 10%, var(--border-color));
        }
        .md-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.84rem;
        }
        .md-th {
          background: color-mix(in srgb, var(--accent) 8%, transparent);
          color: var(--accent);
          font-weight: 700;
          text-align: left;
          padding: 10px 14px;
          font-size: 0.76rem;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 10%, var(--border-color));
        }
        .md-td {
          padding: 8px 14px;
          border-bottom: 1px solid color-mix(in srgb, var(--accent) 5%, var(--border-color));
          color: var(--text-light);
          line-height: 1.5;
        }
        .md-table tr:last-child .md-td {
          border-bottom: none;
        }

        .md-li input[type="checkbox"] {
          accent-color: var(--accent);
          margin-right: 6px;
          transform: scale(1.1);
          vertical-align: middle;
        }

        .zai-input-wrapper {
          padding: 8px 20px 14px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          position: relative;
          z-index: 5;
        }

        .zai-input-container {
          width: 100%;
          max-width: 780px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        .zai-file-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 10px 6px 12px;
          margin: 0 0 0 16px;
          border-radius: 12px 12px 0 0;
          background: color-mix(in srgb, var(--accent) 10%, var(--card-bg));
          border: 1px solid color-mix(in srgb, var(--accent) 20%, transparent);
          border-bottom: none;
          font-size: 0.78rem;
          font-family: 'Space Grotesk', sans-serif;
        }
        .zai-file-chip > i {
          color: var(--accent);
          font-size: 0.8rem;
          flex-shrink: 0;
        }
        .zai-file-chip-name {
          color: var(--text-light);
          font-weight: 600;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 180px;
        }
        .zai-file-chip-size {
          color: var(--text-dim);
          font-size: 0.7rem;
        }
        .zai-file-chip-x {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          border-radius: 4px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 0.65rem;
          transition: all 0.15s;
          flex-shrink: 0;
          margin-left: 2px;
        }
        .zai-file-chip-x:hover {
          color: #ef4444;
          background: color-mix(in srgb, #ef4444 12%, transparent);
        }

        .zai-input-bar {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 12px 14px 12px 8px;
          border-radius: 20px;
          border: 1.5px solid color-mix(in srgb, var(--accent) 12%, var(--border-color));
          background: color-mix(in srgb, var(--card-bg) 50%, transparent);
          backdrop-filter: blur(24px) saturate(1.4);
          -webkit-backdrop-filter: blur(24px) saturate(1.4);
          transition: border-color 0.25s ease, box-shadow 0.25s ease;
        }
        .zai-input-bar:focus-within {
          border-color: color-mix(in srgb, var(--accent) 40%, transparent);
          box-shadow: 0 0 0 4px color-mix(in srgb, var(--accent) 6%, transparent), 0 8px 32px color-mix(in srgb, var(--accent) 8%, transparent);
        }

        .zai-attach-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 38px;
          min-width: 38px;
          border-radius: 12px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .zai-attach-btn:hover {
          color: var(--accent);
          background: color-mix(in srgb, var(--accent) 8%, transparent);
        }

        .zai-textarea {
          flex: 1;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-size: 0.92rem;
          font-family: 'Space Grotesk', sans-serif;
          resize: none;
          outline: none;
          min-height: 24px;
          max-height: 160px;
          line-height: 1.5;
          padding: 8px 10px;
        }
        .zai-textarea::placeholder {
          color: var(--text-dim);
          opacity: 0.5;
        }

        .zai-send-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          min-width: 36px;
          border-radius: 50%;
          background: var(--v-gradient);
          border: none;
          color: #fff;
          cursor: pointer;
          font-size: 0.8rem;
          transition: all 0.2s;
          flex-shrink: 0;
          box-shadow: 0 2px 10px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .zai-send-btn:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 4px 16px color-mix(in srgb, var(--accent) 35%, transparent);
        }
        .zai-send-btn:active:not(:disabled) {
          transform: scale(0.95);
        }
        .zai-send-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
          background: var(--text-dim);
          box-shadow: none;
        }

        .zai-input-disclaimer {
          font-size: 0.68rem;
          color: var(--text-dim);
          opacity: 0.4;
          font-family: 'Space Grotesk', sans-serif;
          text-align: center;
          margin: 0;
          padding-top: 2px;
        }


        @media (max-width: 768px) {
          .zai-chat-sidebar {
            position: fixed;
            top: 0;
            left: 0;
            bottom: 0;
            width: 280px;
            min-width: 280px;
            z-index: 100;
          }
          .zai-chat-sidebar:not(.open) {
            margin-left: -280px;
          }
          .zai-sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            backdrop-filter: blur(4px);
            z-index: 90;
          }
          .zai-suggestions-grid {
            grid-template-columns: 1fr;
          }
          .zai-chat-header {
            padding: 10px 14px;
            min-height: 52px;
          }
          .zai-header-title {
            font-size: 0.92rem;
          }
          .zai-model-pill {
            font-size: 0.58rem;
            padding: 4px 10px;
          }
          .zai-messages-list {
            padding: 16px 10px;
            gap: 16px;
          }
          .zai-msg {
            gap: 8px;
          }
          .zai-msg-avatar {
            width: 28px;
            height: 28px;
            min-width: 28px;
            border-radius: 8px;
          }
          .zai-msg-content {
            max-width: 90%;
            padding: 12px 16px;
            font-size: 0.88rem;
            border-radius: 16px;
          }
          .zai-empty-state {
            padding: 28px 16px 40px;
          }
          .zai-empty-orb {
            width: 80px;
            height: 80px;
            margin-bottom: 16px;
          }
          .zai-empty-orb-inner {
            width: 52px;
            height: 52px;
            border-radius: 16px;
          }
          .zai-empty-title {
            font-size: 1.3rem;
          }
          .zai-empty-sub {
            font-size: 0.85rem;
            margin-bottom: 24px;
          }
          .zai-input-wrapper {
            padding: 6px 10px 10px;
          }
          .zai-input-container {
            max-width: 100%;
          }
          .zai-textarea {
            font-size: 16px !important;
          }
          .zai-input-bar {
            padding: 10px 12px 10px 6px;
            border-radius: 18px;
          }
          .zai-attach-btn {
            width: 34px;
            height: 34px;
            min-width: 34px;
            font-size: 0.85rem;
          }
          .zai-send-btn {
            width: 32px;
            height: 32px;
            min-width: 32px;
            font-size: 0.75rem;
          }
          .zai-input-disclaimer {
            font-size: 0.62rem;
          }
          .zai-file-chip {
            font-size: 0.72rem;
          }
          .zai-file-chip-name {
            max-width: 120px;
          }
          .zai-suggest-card {
            padding: 14px 16px;
          }
        }

        @media (max-width: 480px) {
          .zai-chat-sidebar {
            width: 260px;
            min-width: 260px;
          }
          .zai-chat-sidebar:not(.open) {
            margin-left: -260px;
          }
          .zai-messages-list {
            padding: 12px 8px;
            gap: 14px;
          }
          .zai-msg-content {
            padding: 10px 14px;
            font-size: 0.86rem;
          }
          .zai-empty-title {
            font-size: 1.15rem;
          }
          .zai-suggest-card {
            padding: 12px 14px;
            gap: 10px;
          }
          .zai-suggest-label {
            font-size: 0.8rem;
          }
          .zai-suggest-desc {
            font-size: 0.72rem;
          }
        }
      `}</style>
    </>
  );
}
