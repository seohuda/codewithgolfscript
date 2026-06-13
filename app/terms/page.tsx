import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
};

export default function TermsPage() {
  return (
    <article className="prose prose-sm mx-auto max-w-3xl text-ink">
      <h1 className="text-2xl font-bold">이용약관</h1>
      <p className="text-ink-soft">시행일: 2026년 6월 13일</p>

      <h2 className="mt-8 text-lg font-semibold">제1조 (목적)</h2>
      <p>
        본 약관은 CODE WITH GOLFSCRIPT(이하 &ldquo;서비스&rdquo;)의 이용과 관련하여
        서비스 제공자와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로
        합니다.
      </p>

      <h2 className="mt-8 text-lg font-semibold">제2조 (정의)</h2>
      <ol>
        <li>&ldquo;서비스&rdquo;란 GolfScript 코드 골프 온라인 저지 플랫폼을 말합니다.</li>
        <li>&ldquo;이용자&rdquo;란 본 약관에 따라 서비스를 이용하는 회원을 말합니다.</li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">제3조 (약관의 효력 및 변경)</h2>
      <ol>
        <li>본 약관은 서비스 화면에 게시함으로써 효력이 발생합니다.</li>
        <li>
          약관 변경 시 시행일 7일 전 서비스 내 공지하며, 변경 후 서비스를
          계속 이용하면 변경된 약관에 동의한 것으로 봅니다.
        </li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">제4조 (회원가입)</h2>
      <ol>
        <li>
          이용자는 서비스가 정한 양식에 따라 정보를 기입하고, 본 약관 및
          개인정보처리방침에 동의한 후 회원가입을 신청합니다.
        </li>
        <li>
          이메일 인증을 완료해야 서비스 이용이 가능합니다.
        </li>
        <li>만 14세 미만은 가입할 수 없습니다.</li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">제5조 (회원 탈퇴)</h2>
      <ol>
        <li>이용자는 서비스 내에서 탈퇴를 신청할 수 있습니다.</li>
        <li>
          탈퇴 신청 후 7일간 로그인하지 않으면 계정이 자동으로 삭제됩니다.
          7일 이내에 로그인하면 탈퇴 신청이 철회됩니다.
        </li>
        <li>탈퇴 시 모든 개인정보 및 제출 데이터는 즉시 파기됩니다.</li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">제6조 (서비스 이용)</h2>
      <ol>
        <li>
          이용자는 문제 풀이, 코드 제출, 게시판 이용 등 서비스가 제공하는 기능을
          이용할 수 있습니다.
        </li>
        <li>
          이용자는 서비스 이용 시 법령 및 본 약관을 준수해야 하며, 다음 행위를
          해서는 안 됩니다.
          <ul>
            <li>타인의 개인정보를 도용하거나 허위 정보를 등록하는 행위</li>
            <li>서비스 운영을 방해하거나 시스템에 부하를 주는 행위</li>
            <li>타인을 비방·모욕하거나 불쾌감을 주는 콘텐츠를 게시하는 행위</li>
            <li>자동화 도구를 이용해 대량 요청을 보내는 행위</li>
            <li>기타 법령에 위반되는 행위</li>
          </ul>
        </li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">제7조 (계정 정지)</h2>
      <p>
        서비스는 이용자가 본 약관을 위반하거나 서비스 운영을 방해하는 경우
        사전 통보 후 계정을 정지하거나 삭제할 수 있습니다.
      </p>

      <h2 className="mt-8 text-lg font-semibold">제8조 (지식재산권)</h2>
      <ol>
        <li>문제 콘텐츠의 저작권은 서비스에 귀속됩니다.</li>
        <li>
          이용자가 제출한 코드의 저작권은 이용자에게 있으며, 서비스는
          랭킹·통계 표시를 위해 해당 코드를 이용할 수 있습니다.
        </li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">제9조 (면책)</h2>
      <ol>
        <li>
          서비스는 천재지변, 시스템 장애 등 불가항력으로 인한 서비스 중단에
          대해 책임을 지지 않습니다.
        </li>
        <li>
          이용자가 게시한 콘텐츠로 인해 발생한 분쟁에 대해 서비스는 책임을
          지지 않습니다.
        </li>
      </ol>

      <h2 className="mt-8 text-lg font-semibold">제10조 (분쟁 해결)</h2>
      <p>
        본 약관과 관련하여 분쟁이 발생한 경우 대한민국 법률을 적용하며,
        관할 법원은 서비스 운영자의 소재지를 관할하는 법원으로 합니다.
      </p>

      <h2 className="mt-8 text-lg font-semibold">부칙</h2>
      <p>본 약관은 2026년 6월 13일부터 시행합니다.</p>
    </article>
  );
}
